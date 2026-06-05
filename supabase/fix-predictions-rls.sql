-- Fix "permission denied" when saving predictions
-- Run this entire script in Supabase SQL editor

grant select, insert, update, delete on public.predictions to authenticated;
grant select, insert, update on public.tournament_predictions to authenticated;

alter table public.predictions enable row level security;
alter table public.tournament_predictions enable row level security;

-- Predictions
drop policy if exists "League members can view predictions in their league" on public.predictions;
create policy "League members can view predictions in their league"
  on public.predictions for select
  to authenticated
  using (public.is_league_member(league_id));

drop policy if exists "League members can insert own predictions" on public.predictions;
create policy "League members can insert own predictions"
  on public.predictions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_league_member(league_id)
  );

drop policy if exists "League members can update own predictions" on public.predictions;
create policy "League members can update own predictions"
  on public.predictions for update
  to authenticated
  using (auth.uid() = user_id and public.is_league_member(league_id))
  with check (auth.uid() = user_id and public.is_league_member(league_id));

drop policy if exists "League members can delete own predictions" on public.predictions;
create policy "League members can delete own predictions"
  on public.predictions for delete
  to authenticated
  using (auth.uid() = user_id and public.is_league_member(league_id));

-- Tournament predictions
drop policy if exists "League members can view tournament predictions" on public.tournament_predictions;
create policy "League members can view tournament predictions"
  on public.tournament_predictions for select
  to authenticated
  using (public.is_league_member(league_id));

drop policy if exists "League members can insert own tournament predictions" on public.tournament_predictions;
create policy "League members can insert own tournament predictions"
  on public.tournament_predictions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_league_member(league_id)
  );

drop policy if exists "League members can update own tournament predictions" on public.tournament_predictions;
create policy "League members can update own tournament predictions"
  on public.tournament_predictions for update
  to authenticated
  using (auth.uid() = user_id and public.is_league_member(league_id))
  with check (auth.uid() = user_id and public.is_league_member(league_id));

-- Ensure membership helper exists
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
