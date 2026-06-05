-- Fix "permission denied for table matches"
-- Run this in Supabase SQL editor

grant select on public.matches to authenticated;

alter table public.matches enable row level security;

drop policy if exists "Authenticated users can view matches" on public.matches;

create policy "Authenticated users can view matches"
  on public.matches for select
  to authenticated
  using (true);
