export type MatchStatus = "scheduled" | "live" | "finished";

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface League {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

export interface LeagueMember {
  league_id: string;
  user_id: string;
  joined_at: string;
}

export interface Match {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  created_at: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  league_id: string;
  match_id: string;
  predicted_home: number;
  predicted_away: number;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface TournamentPrediction {
  id: string;
  user_id: string;
  league_id: string;
  winner: string | null;
  runner_up: string | null;
  top_scorer: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  total_points: number;
  predictions_count: number;
}

export interface ScorePrediction {
  predicted_home: number;
  predicted_away: number;
}

export interface ActualResult {
  home_score: number;
  away_score: number;
}
