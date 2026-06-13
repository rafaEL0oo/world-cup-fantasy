import type {
  WorldCup2026Game,
  WorldCup2026Stadium,
  WorldCup2026Team,
} from "./types";

const API_BASE = "https://worldcup26.ir";
const GITHUB_MATCHES =
  "https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main/football.matches.json";
const GITHUB_TEAMS =
  "https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main/football.teams.json";

export class WorldCup2026Error extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: "rate_limit" | "unavailable"
  ) {
    super(message);
    this.name = "WorldCup2026Error";
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 0 } });

  if (res.status === 429) {
    throw new WorldCup2026Error(
      "World Cup 2026 API rate limit reached. Please wait a few minutes and try again.",
      429,
      "rate_limit"
    );
  }

  if (!res.ok) {
    throw new WorldCup2026Error(
      `World Cup 2026 API request failed: ${res.status} ${res.statusText}`,
      res.status,
      "unavailable"
    );
  }

  return res.json() as Promise<T>;
}

function enrichGamesWithTeams(
  games: WorldCup2026Game[],
  teams: WorldCup2026Team[]
): WorldCup2026Game[] {
  const teamMap = new Map(teams.map((team) => [team.id, team.name_en]));

  return games.map((game) => ({
    ...game,
    home_team_name_en:
      game.home_team_name_en ??
      (game.home_team_id !== "0"
        ? teamMap.get(game.home_team_id)
        : undefined),
    away_team_name_en:
      game.away_team_name_en ??
      (game.away_team_id !== "0"
        ? teamMap.get(game.away_team_id)
        : undefined),
  }));
}

export async function fetchWorldCup2026Games(): Promise<{
  games: WorldCup2026Game[];
  stadiums: Map<string, WorldCup2026Stadium>;
  fromFallback: boolean;
}> {
  try {
    const [gamesPayload, stadiumsPayload] = await Promise.all([
      fetchJson<{ games: WorldCup2026Game[] }>(`${API_BASE}/get/games`),
      fetchJson<{ stadiums?: WorldCup2026Stadium[] } | WorldCup2026Stadium[]>(
        `${API_BASE}/get/stadiums`
      ),
    ]);

    const stadiumList = Array.isArray(stadiumsPayload)
      ? stadiumsPayload
      : (stadiumsPayload.stadiums ?? []);

    const stadiums = new Map(
      stadiumList.map((stadium) => [stadium.id, stadium])
    );

    return {
      games: gamesPayload.games ?? [],
      stadiums,
      fromFallback: false,
    };
  } catch (error) {
    if (
      error instanceof WorldCup2026Error &&
      error.code === "rate_limit"
    ) {
      throw error;
    }

    const [games, teams] = await Promise.all([
      fetchJson<WorldCup2026Game[]>(GITHUB_MATCHES),
      fetchJson<WorldCup2026Team[]>(GITHUB_TEAMS),
    ]);

    return {
      games: enrichGamesWithTeams(games, teams),
      stadiums: new Map(),
      fromFallback: true,
    };
  }
}
