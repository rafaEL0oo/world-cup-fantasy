import type { MatchStatus } from "@/types/database";

export interface SeedMatch {
  home_team: string;
  away_team: string;
  kickoff_at: string;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  round?: string;
}

/** World Cup 2026 group-stage fixtures — used when API-Football free plan blocks 2026. */
export const WORLD_CUP_2026_SEED: SeedMatch[] = [
  { home_team: "Mexico", away_team: "South Africa", kickoff_at: "2026-06-11T19:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group A" },
  { home_team: "South Korea", away_team: "UEFA Playoff D", kickoff_at: "2026-06-11T22:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group A" },
  { home_team: "Canada", away_team: "UEFA Playoff A", kickoff_at: "2026-06-12T01:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group B" },
  { home_team: "USA", away_team: "Paraguay", kickoff_at: "2026-06-12T19:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group D" },
  { home_team: "Qatar", away_team: "Switzerland", kickoff_at: "2026-06-12T22:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group B" },
  { home_team: "Brazil", away_team: "Morocco", kickoff_at: "2026-06-13T01:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group C" },
  { home_team: "Haiti", away_team: "Scotland", kickoff_at: "2026-06-13T19:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group C" },
  { home_team: "Australia", away_team: "UEFA Playoff C", kickoff_at: "2026-06-13T22:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group D" },
  { home_team: "Germany", away_team: "Curaçao", kickoff_at: "2026-06-14T01:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group D" },
  { home_team: "Netherlands", away_team: "Japan", kickoff_at: "2026-06-14T19:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group F" },
  { home_team: "Ivory Coast", away_team: "Ecuador", kickoff_at: "2026-06-14T22:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group F" },
  { home_team: "UEFA Playoff B", away_team: "Tunisia", kickoff_at: "2026-06-15T01:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group F" },
  { home_team: "Spain", away_team: "Cape Verde", kickoff_at: "2026-06-15T19:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group H" },
  { home_team: "Belgium", away_team: "Egypt", kickoff_at: "2026-06-15T22:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group G" },
  { home_team: "Saudi Arabia", away_team: "Uruguay", kickoff_at: "2026-06-16T01:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group H" },
  { home_team: "Iran", away_team: "New Zealand", kickoff_at: "2026-06-16T19:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group G" },
  { home_team: "France", away_team: "Senegal", kickoff_at: "2026-06-16T22:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group I" },
  { home_team: "Argentina", away_team: "Algeria", kickoff_at: "2026-06-17T01:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group J" },
  { home_team: "Austria", away_team: "Jordan", kickoff_at: "2026-06-17T19:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group J" },
  { home_team: "Portugal", away_team: "UEFA Playoff Path", kickoff_at: "2026-06-17T22:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group K" },
  { home_team: "England", away_team: "Croatia", kickoff_at: "2026-06-18T01:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group L" },
  { home_team: "Ghana", away_team: "Panama", kickoff_at: "2026-06-18T19:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group L" },
  { home_team: "Uzbekistan", away_team: "Colombia", kickoff_at: "2026-06-18T22:00:00+00:00", home_score: null, away_score: null, status: "scheduled", round: "Group K" },
  { home_team: "Poland", away_team: "Brazil", kickoff_at: "2026-06-05T18:00:00+00:00", home_score: 2, away_score: 1, status: "finished", round: "Friendly" },
];
