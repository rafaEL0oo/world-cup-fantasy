export interface WorldCup2026Game {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  group: string;
  matchday: string;
  local_date: string;
  stadium_id: string;
  finished: string;
  time_elapsed: string;
  type: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
  home_team_label?: string;
  away_team_label?: string;
}

export interface WorldCup2026Stadium {
  id: string;
  region?: string;
  country_en?: string;
}

export interface WorldCup2026Team {
  id: string;
  name_en: string;
}

export interface WorldCup2026SyncResult {
  source: "worldcup2026";
  requestsUsed: number;
  matchesUpserted: number;
}
