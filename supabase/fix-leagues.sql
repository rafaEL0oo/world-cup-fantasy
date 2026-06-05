-- Fix league creation permissions
-- Run this entire script in Supabase SQL editor

grant select, insert, update on public.leagues to authenticated;
grant select, insert on public.league_members to authenticated;

alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

-- Leagues
drop policy if exists "League members can view leagues" on public.leagues;
drop policy if exists "League members and owners can view leagues" on public.leagues;

create policy "League members and owners can view leagues"
  on public.leagues for select
  to authenticated
  using (public.is_league_member(id) or auth.uid() = owner_id);

drop policy if exists "Authenticated users can create leagues" on public.leagues;
create policy "Authenticated users can create leagues"
  on public.leagues for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "League owners can update leagues" on public.leagues;
create policy "League owners can update leagues"
  on public.leagues for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- League members
drop policy if exists "League members can view members" on public.league_members;
create policy "League members can view members"
  on public.league_members for select
  to authenticated
  using (public.is_league_member(league_id) or auth.uid() = user_id);

drop policy if exists "Users can join leagues" on public.league_members;
create policy "Users can join leagues"
  on public.league_members for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Reliable league creation via RPC
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
