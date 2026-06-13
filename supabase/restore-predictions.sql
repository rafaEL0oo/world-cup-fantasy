-- =============================================================================
-- DIAGNOSE & RESTORE PREDICTIONS
-- Run in Supabase → SQL Editor
-- =============================================================================

-- STEP 1: Do predictions still exist?
select count(*) as prediction_count from public.predictions;

-- count > 0  → predictions exist, may just need re-linking (STEP 4)
-- count = 0  → deleted permanently unless you have a backup (STEP 6)


-- STEP 2: View predictions with their matches
select
  p.id as prediction_id,
  p.predicted_home,
  p.predicted_away,
  p.points,
  m.home_team,
  m.away_team,
  m.api_football_id,
  m.kickoff_at
from public.predictions p
left join public.matches m on m.id = p.match_id
order by m.kickoff_at nulls last;


-- STEP 3: Broken links (should be empty — CASCADE deletes these automatically)
select p.*
from public.predictions p
left join public.matches m on m.id = p.match_id
where m.id is null;


-- =============================================================================
-- STEP 4: Re-link predictions from old seed rows to new synced matches
-- Only run if STEP 1 shows predictions exist but UI shows them as missing
-- =============================================================================

-- 4a) Exact team name match
update public.predictions p
set match_id = synced.id,
    updated_at = now()
from public.matches old_m
join public.matches synced
  on synced.home_team = old_m.home_team
 and synced.away_team = old_m.away_team
 and synced.api_football_id is not null
 and synced.id <> old_m.id
where p.match_id = old_m.id
  and old_m.api_football_id is null
  and not exists (
    select 1 from public.predictions existing
    where existing.user_id = p.user_id
      and existing.league_id = p.league_id
      and existing.match_id = synced.id
  );

-- 4b) Seed team names that differ from worldcup26.ir API
with renamed_fixtures (old_home, old_away, new_home, new_away) as (
  values
    ('South Korea', 'UEFA Playoff D', 'South Korea', 'Czech Republic'),
    ('Canada', 'UEFA Playoff A', 'Canada', 'Bosnia and Herzegovina'),
    ('Australia', 'UEFA Playoff C', 'Australia', 'Turkey'),
    ('UEFA Playoff B', 'Tunisia', 'Wales', 'Tunisia'),
    ('Portugal', 'UEFA Playoff Path', 'Portugal', 'Denmark'),
    ('USA', 'Paraguay', 'United States', 'Paraguay')
)
update public.predictions p
set match_id = synced.id,
    updated_at = now()
from public.matches old_m
join renamed_fixtures rf
  on old_m.home_team = rf.old_home
 and old_m.away_team = rf.old_away
join public.matches synced
  on synced.home_team = rf.new_home
 and synced.away_team = rf.new_away
 and synced.api_football_id is not null
where p.match_id = old_m.id
  and old_m.api_football_id is null
  and not exists (
    select 1 from public.predictions existing
    where existing.user_id = p.user_id
      and existing.league_id = p.league_id
      and existing.match_id = synced.id
  );

-- Re-run STEP 2 to confirm predictions are linked


-- =============================================================================
-- STEP 5: Remove leftover duplicate seed rows (only after STEP 4)
-- =============================================================================
/*
delete from public.matches
where api_football_id is null
  and id not in (select distinct match_id from public.predictions);
*/


-- =============================================================================
-- STEP 6: Predictions count = 0 — full restore from backup
--
-- Free Supabase plan: backups not available — predictions cannot be restored
-- Pro plan: Dashboard → Database → Backups → Point in time recovery
--           Choose a time BEFORE match sync deleted the data
--           WARNING: restores the entire database, not just predictions
-- =============================================================================
