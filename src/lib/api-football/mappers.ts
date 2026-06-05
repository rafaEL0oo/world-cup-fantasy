import type { MatchStatus } from "@/types/database";
import type { ApiFootballFixture } from "./types";

const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

export function mapApiStatus(short: string): MatchStatus {
  if (LIVE_STATUSES.has(short)) return "live";
  if (FINISHED_STATUSES.has(short)) return "finished";
  return "scheduled";
}

export function mapApiScores(fixture: ApiFootballFixture): {
  home_score: number | null;
  away_score: number | null;
} {
  const status = fixture.fixture.status.short;

  if (FINISHED_STATUSES.has(status)) {
    return {
      home_score: fixture.score.fulltime.home ?? fixture.goals.home,
      away_score: fixture.score.fulltime.away ?? fixture.goals.away,
    };
  }

  if (LIVE_STATUSES.has(status)) {
    return {
      home_score: fixture.goals.home,
      away_score: fixture.goals.away,
    };
  }

  return { home_score: null, away_score: null };
}

export function mapFixtureToMatch(fixture: ApiFootballFixture) {
  const scores = mapApiScores(fixture);

  return {
    api_football_id: fixture.fixture.id,
    home_team: fixture.teams.home.name,
    away_team: fixture.teams.away.name,
    kickoff_at: fixture.fixture.date,
    home_score: scores.home_score,
    away_score: scores.away_score,
    status: mapApiStatus(fixture.fixture.status.short),
    round: fixture.league.round,
    stage: fixture.league.name,
    last_synced_at: new Date().toISOString(),
  };
}
