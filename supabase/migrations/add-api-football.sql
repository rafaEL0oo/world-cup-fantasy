-- Add API-Football sync fields to matches
alter table public.matches
  add column if not exists api_football_id integer unique,
  add column if not exists round text,
  add column if not exists stage text,
  add column if not exists last_synced_at timestamptz;

create index if not exists matches_api_football_id_idx on public.matches (api_football_id);
create index if not exists matches_status_idx on public.matches (status);

-- Track API usage (free plan: 100 requests/day)
create table if not exists public.api_sync_log (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null,
  requests_used int not null default 1,
  matches_updated int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists api_sync_log_created_at_idx on public.api_sync_log (created_at);

alter table public.api_sync_log enable row level security;

-- Only service role writes sync logs; no public access needed
create policy "No public access to sync logs"
  on public.api_sync_log for select
  to authenticated
  using (false);
