-- World Cup Predictor League — Supabase schema
-- Run this in the Supabase SQL editor

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Leagues
create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index leagues_owner_id_idx on public.leagues (owner_id);
create index leagues_invite_code_idx on public.leagues (invite_code);

-- League members
create table public.league_members (
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create index league_members_user_id_idx on public.league_members (user_id);

-- Matches
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  home_team text not null,
  away_team text not null,
  kickoff_at timestamptz not null,
  home_score int,
  away_score int,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'finished')),
  created_at timestamptz not null default now()
);

create index matches_kickoff_at_idx on public.matches (kickoff_at);

-- Predictions
create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  league_id uuid not null references public.leagues (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  predicted_home int not null check (predicted_home >= 0),
  predicted_away int not null check (predicted_away >= 0),
  points int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, league_id, match_id)
);

create index predictions_league_id_idx on public.predictions (league_id);
create index predictions_match_id_idx on public.predictions (match_id);

-- Tournament predictions
create table public.tournament_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  league_id uuid not null references public.leagues (id) on delete cascade,
  winner text,
  runner_up text,
  top_scorer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, league_id)
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Scoring helper (mirrors src/lib/scoring.ts)
create or replace function public.calculate_points(
  predicted_home int,
  predicted_away int,
  actual_home int,
  actual_away int
)
returns int
language plpgsql
immutable
as $$
declare
  predicted_outcome text;
  actual_outcome text;
begin
  if predicted_home = actual_home and predicted_away = actual_away then
    return 5;
  end if;

  if predicted_home > predicted_away then
    predicted_outcome := 'home';
  elsif predicted_home < predicted_away then
    predicted_outcome := 'away';
  else
    predicted_outcome := 'draw';
  end if;

  if actual_home > actual_away then
    actual_outcome := 'home';
  elsif actual_home < actual_away then
    actual_outcome := 'away';
  else
    actual_outcome := 'draw';
  end if;

  if predicted_outcome = actual_outcome then
    return 2;
  end if;

  return 0;
end;
$$;

-- Recalculate prediction points when a match result is set
create or replace function public.recalculate_match_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.home_score is not null
    and new.away_score is not null
    and new.status = 'finished'
    and (
      old.home_score is distinct from new.home_score
      or old.away_score is distinct from new.away_score
      or old.status is distinct from new.status
    )
  then
    update public.predictions p
    set
      points = public.calculate_points(
        p.predicted_home,
        p.predicted_away,
        new.home_score,
        new.away_score
      ),
      updated_at = now()
    where p.match_id = new.id;
  end if;

  return new;
end;
$$;

create trigger on_match_result_updated
  after update on public.matches
  for each row execute function public.recalculate_match_points();

-- Membership helper for RLS
create or replace function public.is_league_member(p_league_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.league_members lm
    where lm.league_id = p_league_id
      and lm.user_id = auth.uid()
  );
$$;

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.tournament_predictions enable row level security;

-- Profiles policies
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Leagues policies
create policy "League members can view leagues"
  on public.leagues for select
  to authenticated
  using (public.is_league_member(id));

create policy "Authenticated users can create leagues"
  on public.leagues for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "League owners can update leagues"
  on public.leagues for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- League members policies
create policy "League members can view members"
  on public.league_members for select
  to authenticated
  using (public.is_league_member(league_id));

create policy "Users can join leagues"
  on public.league_members for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Matches policies (global fixture list)
create policy "Authenticated users can view matches"
  on public.matches for select
  to authenticated
  using (true);

-- Predictions policies
create policy "League members can view predictions in their league"
  on public.predictions for select
  to authenticated
  using (public.is_league_member(league_id));

create policy "League members can insert own predictions"
  on public.predictions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_league_member(league_id)
  );

create policy "League members can update own predictions"
  on public.predictions for update
  to authenticated
  using (auth.uid() = user_id and public.is_league_member(league_id))
  with check (auth.uid() = user_id and public.is_league_member(league_id));

create policy "League members can delete own predictions"
  on public.predictions for delete
  to authenticated
  using (auth.uid() = user_id and public.is_league_member(league_id));

-- Tournament predictions policies
create policy "League members can view tournament predictions"
  on public.tournament_predictions for select
  to authenticated
  using (public.is_league_member(league_id));

create policy "League members can insert own tournament predictions"
  on public.tournament_predictions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_league_member(league_id)
  );

create policy "League members can update own tournament predictions"
  on public.tournament_predictions for update
  to authenticated
  using (auth.uid() = user_id and public.is_league_member(league_id))
  with check (auth.uid() = user_id and public.is_league_member(league_id));

-- Join league by invite code (bypasses RLS so non-members can look up leagues)
create or replace function public.join_league_by_invite(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_league_id uuid;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select id into v_league_id
  from public.leagues
  where invite_code = upper(trim(p_invite_code));

  if v_league_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.league_members (league_id, user_id)
  values (v_league_id, v_user_id)
  on conflict do nothing;

  return v_league_id;
end;
$$;

grant execute on function public.join_league_by_invite(text) to authenticated;
