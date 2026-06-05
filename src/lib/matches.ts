import { addDays } from "date-fns";
import type { Match } from "@/types/database";

export const PREDICTION_LOCK_MINUTES = 10;
export const PREDICTION_WINDOW_DAYS = 7;

export function getPredictionLockTime(kickoffAt: string | Date): Date {
  const kickoff = new Date(kickoffAt);
  return new Date(kickoff.getTime() - PREDICTION_LOCK_MINUTES * 60 * 1000);
}

/** Predictions open 7 days before kickoff. */
export function getPredictionOpensAt(kickoffAt: string | Date): Date {
  return addDays(new Date(kickoffAt), -PREDICTION_WINDOW_DAYS);
}

export function isPredictionLocked(
  kickoffAt: string | Date,
  now: Date = new Date()
): boolean {
  return now >= getPredictionLockTime(kickoffAt);
}

/** True when within the 7-day prediction window and not yet locked. */
export function isPredictionOpen(
  kickoffAt: string | Date,
  now: Date = new Date()
): boolean {
  const kickoff = new Date(kickoffAt);
  if (kickoff <= now) return false;
  return now >= getPredictionOpensAt(kickoffAt) && !isPredictionLocked(kickoffAt, now);
}

export function getUpcomingMatches(matches: Match[]): Match[] {
  return matches
    .filter((m) => m.status !== "finished")
    .sort(
      (a, b) =>
        new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime()
    );
}

export function splitMatchesForPrediction(
  matches: Match[],
  now: Date = new Date()
): { openNow: Match[]; comingLater: Match[] } {
  const upcoming = getUpcomingMatches(matches);

  const openNow: Match[] = [];
  const comingLater: Match[] = [];

  for (const match of upcoming) {
    if (isPredictionOpen(match.kickoff_at, now)) {
      openNow.push(match);
    } else if (new Date(match.kickoff_at) > now) {
      comingLater.push(match);
    }
  }

  return { openNow, comingLater };
}

/** @deprecated Use splitMatchesForPrediction */
export function getPredictableMatches(
  matches: Match[],
  _daysAhead: number = PREDICTION_WINDOW_DAYS,
  now: Date = new Date()
): Match[] {
  return splitMatchesForPrediction(matches, now).openNow;
}

/** Tournament starts at the first official match kickoff (excludes friendlies). */
export function getTournamentStartTime(matches: Match[]): Date | null {
  const official = matches.filter(
    (m) => !m.round?.toLowerCase().includes("friendly")
  );
  const pool = official.length > 0 ? official : matches;
  if (!pool.length) return null;

  const earliest = pool.reduce((min, m) => {
    const t = new Date(m.kickoff_at).getTime();
    return t < min ? t : min;
  }, new Date(pool[0].kickoff_at).getTime());

  return new Date(earliest);
}

export function isTournamentStarted(
  matches: Match[],
  now: Date = new Date()
): boolean {
  const start = getTournamentStartTime(matches);
  if (!start) return false;
  return now >= start;
}

/** Unique teams from all matches, sorted alphabetically. */
export function getTeamsFromMatches(matches: Match[]): string[] {
  const teams = new Set<string>();
  for (const m of matches) {
    teams.add(m.home_team);
    teams.add(m.away_team);
  }
  return Array.from(teams).sort((a, b) => a.localeCompare(b));
}
