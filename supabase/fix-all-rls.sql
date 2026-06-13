-- =============================================================================
-- PRODUCTION FIX — run this entire file in Supabase → SQL Editor → Run
-- Fixes "permission denied" for profiles, leagues, matches, predictions, etc.
-- =============================================================================

-- Schema access (often missing on older projects)
grant usage on schema public to postgres, anon, authenticated, service_role;

-- Table grants for logged-in users
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.leagues to authenticated;
grant select, insert on public.league_members to authenticated;
grant select on public.matches to authenticated;
grant select, insert, update, delete on public.predictions to authenticated;
grant select, insert, update on public.tournament_predictions to authenticated;

-- Service role needs write access for match sync (Refresh matches / login sync)
grant select, insert, update, delete on public.matches to service_role;
grant select, insert on public.api_sync_log to service_role;

-- Membership helper
create or replace function public.is_league_member(p_league_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.league_members lm
    where lm.league_id = p_league_id and lm.user_id = auth.uid()
  );
$$;

grant execute on function public.is_league_member(uuid) to authenticated;

-- Profiles
alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- Leagues
alter table public.leagues enable row level security;

drop policy if exists "League members can view leagues" on public.leagues;
drop policy if exists "League members and owners can view leagues" on public.leagues;
create policy "League members and owners can view leagues"
  on public.leagues for select to authenticated
  using (public.is_league_member(id) or auth.uid() = owner_id);

drop policy if exists "Authenticated users can create leagues" on public.leagues;
create policy "Authenticated users can create leagues"
  on public.leagues for insert to authenticated with check (auth.uid() = owner_id);

drop policy if exists "League owners can update leagues" on public.leagues;
create policy "League owners can update leagues"
  on public.leagues for update to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- League members
alter table public.league_members enable row level security;

drop policy if exists "Users can join leagues" on public.league_members;
create policy "Users can join leagues"
  on public.league_members for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "League members can view members" on public.league_members;
create policy "League members can view members"
  on public.league_members for select to authenticated
  using (public.is_league_member(league_id) or auth.uid() = user_id);

-- Matches
alter table public.matches enable row level security;

drop policy if exists "Authenticated users can view matches" on public.matches;
create policy "Authenticated users can view matches"
  on public.matches for select to authenticated using (true);

-- Predictions
alter table public.predictions enable row level security;

drop policy if exists "League members can view predictions in their league" on public.predictions;
create policy "League members can view predictions in their league"
  on public.predictions for select to authenticated
  using (public.is_league_member(league_id));

drop policy if exists "League members can insert own predictions" on public.predictions;
create policy "League members can insert own predictions"
  on public.predictions for insert to authenticated
  with check (auth.uid() = user_id and public.is_league_member(league_id));

drop policy if exists "League members can update own predictions" on public.predictions;
create policy "League members can update own predictions"
  on public.predictions for update to authenticated
  using (auth.uid() = user_id and public.is_league_member(league_id))
  with check (auth.uid() = user_id and public.is_league_member(league_id));

drop policy if exists "League members can delete own predictions" on public.predictions;
create policy "League members can delete own predictions"
  on public.predictions for delete to authenticated
  using (auth.uid() = user_id and public.is_league_member(league_id));

-- Tournament predictions
alter table public.tournament_predictions enable row level security;

drop policy if exists "League members can view tournament predictions" on public.tournament_predictions;
create policy "League members can view tournament predictions"
  on public.tournament_predictions for select to authenticated
  using (public.is_league_member(league_id));

drop policy if exists "League members can insert own tournament predictions" on public.tournament_predictions;
create policy "League members can insert own tournament predictions"
  on public.tournament_predictions for insert to authenticated
  with check (auth.uid() = user_id and public.is_league_member(league_id));

drop policy if exists "League members can update own tournament predictions" on public.tournament_predictions;
create policy "League members can update own tournament predictions"
  on public.tournament_predictions for update to authenticated
  using (auth.uid() = user_id and public.is_league_member(league_id))
  with check (auth.uid() = user_id and public.is_league_member(league_id));

-- Sync log — block public reads
alter table public.api_sync_log enable row level security;

drop policy if exists "No public access to sync logs" on public.api_sync_log;
create policy "No public access to sync logs"
  on public.api_sync_log for select to authenticated using (false);

-- League RPCs (create / join)
create or replace function public.create_league(p_name text, p_invite_code text)
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

  if trim(p_name) = '' then
    raise exception 'League name is required';
  end if;

  if not exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'Profile not found';
  end if;

  insert into public.leagues (name, invite_code, owner_id)
  values (trim(p_name), upper(trim(p_invite_code)), v_user_id)
  returning id into v_league_id;

  insert into public.league_members (league_id, user_id)
  values (v_league_id, v_user_id)
  on conflict do nothing;

  return v_league_id;
end;
$$;

grant execute on function public.create_league(text, text) to authenticated;

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

-- Match sync RPC (service role only — used by Refresh matches on Vercel)
create or replace function public.bulk_upsert_matches(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  row jsonb;
  count int := 0;
begin
  if coalesce(auth.jwt() ->> 'role', '') not in ('service_role', 'supabase_admin') then
    raise exception 'permission denied for function bulk_upsert_matches';
  end if;

  for row in select * from jsonb_array_elements(p_rows)
  loop
    insert into public.matches (
      api_football_id,
      home_team,
      away_team,
      kickoff_at,
      home_score,
      away_score,
      status,
      round,
      stage,
      last_synced_at
    ) values (
      (row ->> 'api_football_id')::integer,
      row ->> 'home_team',
      row ->> 'away_team',
      (row ->> 'kickoff_at')::timestamptz,
      nullif(row ->> 'home_score', 'null')::int,
      nullif(row ->> 'away_score', 'null')::int,
      row ->> 'status',
      row ->> 'round',
      row ->> 'stage',
      (row ->> 'last_synced_at')::timestamptz
    )
    on conflict (api_football_id) do update set
      home_team = excluded.home_team,
      away_team = excluded.away_team,
      kickoff_at = excluded.kickoff_at,
      home_score = excluded.home_score,
      away_score = excluded.away_score,
      status = excluded.status,
      round = excluded.round,
      stage = excluded.stage,
      last_synced_at = excluded.last_synced_at;

    count := count + 1;
  end loop;

  return count;
end;
$$;

revoke all on function public.bulk_upsert_matches(jsonb) from public;
grant execute on function public.bulk_upsert_matches(jsonb) to service_role;
