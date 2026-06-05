import type { ActualResult, ScorePrediction } from "@/types/database";

type Outcome = "home" | "away" | "draw";

function getOutcome(home: number, away: number): Outcome {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

/**
 * Scoring rules:
 * - Exact score: 5 points
 * - Correct winner/draw: 2 points
 * - Wrong prediction: 0 points
 */
export function calculatePoints(
  prediction: ScorePrediction,
  actualResult: ActualResult
): number {
  const { predicted_home, predicted_away } = prediction;
  const { home_score, away_score } = actualResult;

  if (predicted_home === home_score && predicted_away === away_score) {
    return 5;
  }

  const predictedOutcome = getOutcome(predicted_home, predicted_away);
  const actualOutcome = getOutcome(home_score, away_score);

  if (predictedOutcome === actualOutcome) {
    return 2;
  }

  return 0;
}
