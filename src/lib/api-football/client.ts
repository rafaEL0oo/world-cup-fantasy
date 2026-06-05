import { format, addDays } from "date-fns";
import type { ApiFootballFixture, ApiFootballResponse } from "./types";

const BASE_URL = "https://v3.football.api-sports.io";
export const WC_LEAGUE_ID = 1;
export const WC_SEASON = 2026;
const DAILY_REQUEST_LIMIT = 100;

export class ApiFootballError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "ApiFootballError";
  }
}

export async function apiFootballFetch<T>(
  path: string
): Promise<ApiFootballResponse<T>> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    throw new ApiFootballError("API_FOOTBALL_KEY is not configured.");
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "x-apisports-key": key,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new ApiFootballError(
      `API-Football request failed: ${res.status} ${res.statusText}`,
      res.status
    );
  }

  const data = (await res.json()) as ApiFootballResponse<T>;

  if (data.errors && Object.keys(data.errors).length > 0) {
    const msg = Object.values(data.errors).join(", ");
    throw new ApiFootballError(msg);
  }

  return data;
}

/** All World Cup 2026 fixtures — 1 API request (~104 matches). */
export async function fetchAllWorldCupFixtures(): Promise<ApiFootballFixture[]> {
  const data = await apiFootballFetch<ApiFootballFixture[]>(
    `/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`
  );
  return data.response;
}

/** Fixtures in a date window — 1 API request. */
export async function fetchFixturesByDateRange(
  from: string,
  to: string
): Promise<ApiFootballFixture[]> {
  const data = await apiFootballFetch<ApiFootballFixture[]>(
    `/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}&from=${from}&to=${to}`
  );
  return data.response;
}

/**
 * Yesterday through tomorrow — 1 API request.
 * Covers live matches, recent results, and upcoming kickoffs.
 */
export async function fetchRecentAndUpcomingFixtures(): Promise<ApiFootballFixture[]> {
  const from = format(addDays(new Date(), -1), "yyyy-MM-dd");
  const to = format(addDays(new Date(), 1), "yyyy-MM-dd");
  return fetchFixturesByDateRange(from, to);
}

/** All live matches globally — 1 API request, filter to WC in code. */
export async function fetchLiveWorldCupFixtures(): Promise<ApiFootballFixture[]> {
  const data = await apiFootballFetch<ApiFootballFixture[]>(`/fixtures?live=all`);
  return data.response.filter((f) => f.league.id === WC_LEAGUE_ID);
}

export function getDailyRequestLimit(): number {
  return DAILY_REQUEST_LIMIT;
}
