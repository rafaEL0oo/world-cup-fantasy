export interface ApiFootballFixture {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
    };
  };
  league: {
    id: number;
    name: string;
    season: number;
    round: string;
  };
  teams: {
    home: { name: string };
    away: { name: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    fulltime: { home: number | null; away: number | null };
  };
}

export interface ApiFootballResponse<T> {
  get: string;
  results: number;
  response: T;
  errors?: Record<string, string>;
}

export type SyncMode = "full" | "today" | "live";

export interface SyncResult {
  mode: SyncMode;
  requestsUsed: number;
  matchesUpserted: number;
  dailyRequestsSoFar: number;
  remainingBudget: number;
}
