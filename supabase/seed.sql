-- Seed World Cup 2026 group-stage fixtures (sample data)
-- Run after schema.sql

insert into public.matches (home_team, away_team, kickoff_at, home_score, away_score, status) values
  ('Mexico', 'South Africa', '2026-06-11 19:00:00+00', null, null, 'scheduled'),
  ('South Korea', 'UEFA Playoff D', '2026-06-11 22:00:00+00', null, null, 'scheduled'),
  ('Canada', 'UEFA Playoff A', '2026-06-12 01:00:00+00', null, null, 'scheduled'),
  ('USA', 'Paraguay', '2026-06-12 19:00:00+00', null, null, 'scheduled'),
  ('Qatar', 'Switzerland', '2026-06-12 22:00:00+00', null, null, 'scheduled'),
  ('Brazil', 'Morocco', '2026-06-13 01:00:00+00', null, null, 'scheduled'),
  ('Haiti', 'Scotland', '2026-06-13 19:00:00+00', null, null, 'scheduled'),
  ('Australia', 'UEFA Playoff C', '2026-06-13 22:00:00+00', null, null, 'scheduled'),
  ('Germany', 'Curaçao', '2026-06-14 01:00:00+00', null, null, 'scheduled'),
  ('Netherlands', 'Japan', '2026-06-14 19:00:00+00', null, null, 'scheduled'),
  ('Ivory Coast', 'Ecuador', '2026-06-14 22:00:00+00', null, null, 'scheduled'),
  ('UEFA Playoff B', 'Tunisia', '2026-06-15 01:00:00+00', null, null, 'scheduled'),
  ('Spain', 'Cape Verde', '2026-06-15 19:00:00+00', null, null, 'scheduled'),
  ('Belgium', 'Egypt', '2026-06-15 22:00:00+00', null, null, 'scheduled'),
  ('Saudi Arabia', 'Uruguay', '2026-06-16 01:00:00+00', null, null, 'scheduled'),
  ('Iran', 'New Zealand', '2026-06-16 19:00:00+00', null, null, 'scheduled'),
  ('France', 'Senegal', '2026-06-16 22:00:00+00', null, null, 'scheduled'),
  ('Argentina', 'Algeria', '2026-06-17 01:00:00+00', null, null, 'scheduled'),
  ('Austria', 'Jordan', '2026-06-17 19:00:00+00', null, null, 'scheduled'),
  ('Portugal', 'UEFA Playoff Path', '2026-06-17 22:00:00+00', null, null, 'scheduled'),
  ('England', 'Croatia', '2026-06-18 01:00:00+00', null, null, 'scheduled'),
  ('Ghana', 'Panama', '2026-06-18 19:00:00+00', null, null, 'scheduled'),
  ('Uzbekistan', 'Colombia', '2026-06-18 22:00:00+00', null, null, 'scheduled'),
  ('Poland', 'Brazil', '2026-06-05 18:00:00+00', 2, 1, 'finished');
