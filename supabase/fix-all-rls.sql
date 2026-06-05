-- Run this ONCE in Supabase SQL editor to fix all permission errors
-- (profiles, leagues, matches, predictions, tournament)

-- Grants
grant select on public.profiles to authenticated;
grant insert, update on public.profiles to authenticated;

grant select, insert, update on public.leagues to authenticated;
grant select, insert on public.league_members to authenticated;

grant select on public.matches to authenticated;

grant select, insert, update, delete on public.predictions to authenticated;
grant select, insert, update on public.tournament_predictions to authenticated;

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

-- Profiles
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
drop policy if exists "League members can view leagues" on public.leagues;
drop policy if exists "League members and owners can view leagues" on public.leagues;
create policy "League members and owners can view leagues"
  on public.leagues for select to authenticated
  using (public.is_league_member(id) or auth.uid() = owner_id);

drop policy if exists "Authenticated users can create leagues" on public.leagues;
create policy "Authenticated users can create leagues"
  on public.leagues for insert to authenticated with check (auth.uid() = owner_id);

drop policy if exists "Users can join leagues" on public.league_members;
create policy "Users can join leagues"
  on public.league_members for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "League members can view members" on public.league_members;
create policy "League members can view members"
  on public.league_members for select to authenticated
  using (public.is_league_member(league_id) or auth.uid() = user_id);

-- Matches
drop policy if exists "Authenticated users can view matches" on public.matches;
create policy "Authenticated users can view matches"
  on public.matches for select to authenticated using (true);

-- Predictions
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

-- Tournament predictions
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
