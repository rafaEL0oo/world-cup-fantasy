-- Fix missing profiles for users who signed up before the trigger existed.
-- Run this entire script in the Supabase SQL editor.

-- 1. Allow users to create their own profile (for app fallback)
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- 2. Backfill profiles for all existing auth users
insert into public.profiles (id, username, avatar_url)
select
  u.id,
  coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    split_part(u.email, '@', 1)
  ),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 3. Ensure auto-profile trigger exists for future signups
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
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. League RLS fix (owners must read league right after creation)
drop policy if exists "League members can view leagues" on public.leagues;
drop policy if exists "League members and owners can view leagues" on public.leagues;

create policy "League members and owners can view leagues"
  on public.leagues for select
  to authenticated
  using (public.is_league_member(id) or auth.uid() = owner_id);
