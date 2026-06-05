-- Fix: league owners could not read their league immediately after INSERT
-- (needed for .insert().select() during creation)
-- Run this in the Supabase SQL editor if you already applied schema.sql

drop policy if exists "League members can view leagues" on public.leagues;

create policy "League members and owners can view leagues"
  on public.leagues for select
  to authenticated
  using (public.is_league_member(id) or auth.uid() = owner_id);
