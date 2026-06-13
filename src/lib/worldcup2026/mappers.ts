import type { MatchStatus } from "@/types/database";
import type { WorldCup2026Game, WorldCup2026Stadium } from "./types";

const REGION_TIMEZONES: Record<string, string> = {
  Central: "America/Chicago",
  Eastern: "America/New_York",
  Pacific: "America/Los_Angeles",
  Mountain: "America/Denver",
};

const COUNTRY_TIMEZONES: Record<string, string> = {
  Mexico: "America/Mexico_City",
  Canada: "America/Toronto",
  "United States": "America/New_York",
};

/** Negative IDs distinguish worldcup2026 matches from API-Football rows. */
export function worldCup2026ExternalId(gameId: string): number {
  return -Number.parseInt(gameId, 10);
}

function stadiumTimezone(
  stadiumId: string,
  stadiums: Map<string, WorldCup2026Stadium>
): string {
  const stadium = stadiums.get(stadiumId);
  if (!stadium) return "America/Chicago";

  if (stadium.region && REGION_TIMEZONES[stadium.region]) {
    return REGION_TIMEZONES[stadium.region];
  }

  if (stadium.country_en && COUNTRY_TIMEZONES[stadium.country_en]) {
    return COUNTRY_TIMEZONES[stadium.country_en];
  }

  return "America/Chicago";
}

/** Parses "MM/DD/YYYY HH:mm" in the stadium's local timezone. */
export function parseLocalKickoff(
  localDate: string,
  stadiumId: string,
  stadiums: Map<string, WorldCup2026Stadium>
): string {
  const match = localDate.match(
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/
  );
  if (!match) {
    return new Date().toISOString();
  }

  const [, month, day, year, hour, minute] = match;
  const tz = stadiumTimezone(stadiumId, stadiums);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const target = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );

  for (let offsetHours = -16; offsetHours <= 16; offsetHours++) {
    const probe = new Date(target + offsetHours * 60 * 60 * 1000);
    const parts = Object.fromEntries(
      formatter
        .formatToParts(probe)
        .filter((p) => p.type !== "literal")
        .map((p) => [p.type, p.value])
    );

    if (
      parts.year === year &&
      parts.month === month &&
      parts.day === day &&
      parts.hour === hour.padStart(2, "0") &&
      parts.minute === minute
    ) {
      return probe.toISOString();
    }
  }

  return new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
  ).toISOString();
}

function teamName(
  game: WorldCup2026Game,
  side: "home" | "away"
): string {
  const name =
    side === "home" ? game.home_team_name_en : game.away_team_name_en;
  const label =
    side === "home" ? game.home_team_label : game.away_team_label;

  if (name?.trim()) return name.trim();
  if (label?.trim()) return label.trim();
  return side === "home" ? "TBD (Home)" : "TBD (Away)";
}

function mapStatus(game: WorldCup2026Game): MatchStatus {
  if (game.finished === "TRUE" || game.time_elapsed === "finished") {
    return "finished";
  }

  if (game.time_elapsed !== "notstarted") {
    return "live";
  }

  return "scheduled";
}

function mapRound(game: WorldCup2026Game): string {
  if (game.type === "group") return `Group ${game.group}`;

  const labels: Record<string, string> = {
    r32: "Round of 32",
    r16: "Round of 16",
    qf: "Quarter-finals",
    sf: "Semi-finals",
    third: "Third place",
    final: "Final",
  };

  return labels[game.type] ?? game.group;
}

function parseScore(value: string, status: MatchStatus): number | null {
  const score = Number.parseInt(value, 10);
  if (Number.isNaN(score)) return null;
  if (status === "scheduled") return null;
  return score;
}

export function mapGameToMatch(
  game: WorldCup2026Game,
  stadiums: Map<string, WorldCup2026Stadium>
) {
  const status = mapStatus(game);

  return {
    api_football_id: worldCup2026ExternalId(game.id),
    home_team: teamName(game, "home"),
    away_team: teamName(game, "away"),
    kickoff_at: parseLocalKickoff(game.local_date, game.stadium_id, stadiums),
    home_score: parseScore(game.home_score, status),
    away_score: parseScore(game.away_score, status),
    status,
    round: mapRound(game),
    stage: "FIFA World Cup 2026",
    last_synced_at: new Date().toISOString(),
  };
}
