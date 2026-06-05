-- Fix "permission denied" for tournament predictions
-- Run in Supabase SQL editor

grant select, insert, update on public.tournament_predictions to authenticated;

alter table public.tournament_predictions enable row level security;

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
