import { createAdminClient } from "@/lib/supabase/admin";
import { seedMatchesIfEmpty } from "@/lib/matches/seed-matches";
import {
  syncWorldCup2026Matches,
  WorldCup2026Error,
} from "@/lib/worldcup2026/sync";
import {
  ApiFootballError,
  fetchAllWorldCupFixtures,
  fetchLiveWorldCupFixtures,
  fetchRecentAndUpcomingFixtures,
  getDailyRequestLimit,
} from "./client";
import { mapFixtureToMatch } from "./mappers";
import type { ApiFootballFixture, SyncMode, SyncResult } from "./types";

const SEASON_BLOCKED_ENDPOINT = "season_unavailable";

function isSeasonRestrictedError(error: unknown): boolean {
  return (
    error instanceof ApiFootballError &&
    error.message.toLowerCase().includes("free plans")
  );
}

async function getAdminSupabase() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

async function getDailyRequestCount(): Promise<number> {
  const supabase = await getAdminSupabase();
  if (!supabase) return 0;

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("api_sync_log")
    .select("requests_used")
    .gte("created_at", startOfDay.toISOString());

  return (data ?? []).reduce((sum, row) => sum + row.requests_used, 0);
}

async function isApiSeasonBlocked(): Promise<boolean> {
  const supabase = await getAdminSupabase();
  if (!supabase) return true;

  const { data } = await supabase
    .from("api_sync_log")
    .select("id")
    .eq("endpoint", SEASON_BLOCKED_ENDPOINT)
    .limit(1)
    .maybeSingle();

  return !!data;
}

async function markApiSeasonBlocked(): Promise<void> {
  const supabase = await getAdminSupabase();
  if (!supabase) return;

  const { data: existing } = await supabase
    .from("api_sync_log")
    .select("id")
    .eq("endpoint", SEASON_BLOCKED_ENDPOINT)
    .limit(1)
    .maybeSingle();

  if (existing) return;

  await supabase.from("api_sync_log").insert({
    endpoint: SEASON_BLOCKED_ENDPOINT,
    requests_used: 0,
    matches_updated: 0,
  });
}

async function logSync(
  endpoint: string,
  requestsUsed: number,
  matchesUpdated: number
) {
  const supabase = await getAdminSupabase();
  if (!supabase) return;

  await supabase.from("api_sync_log").insert({
    endpoint,
    requests_used: requestsUsed,
    matches_updated: matchesUpdated,
  });
}

async function upsertFixtures(
  fixtures: ApiFootballFixture[]
): Promise<number> {
  if (!fixtures.length) return 0;

  const supabase = await getAdminSupabase();
  if (!supabase) return 0;

  const rows = fixtures.map(mapFixtureToMatch);

  const { error } = await supabase
    .from("matches")
    .upsert(rows, { onConflict: "api_football_id" });

  if (error) {
    throw new Error(`Failed to upsert matches: ${error.message}`);
  }

  return rows.length;
}

function assertBudget(used: number, needed: number) {
  const limit = getDailyRequestLimit();
  if (used + needed > limit) {
    throw new Error(
      `API-Football daily budget exceeded (${used}/${limit} used, need ${needed} more). Try again tomorrow.`
    );
  }
}

export async function syncMatches(mode: SyncMode): Promise<SyncResult> {
  const dailyUsed = await getDailyRequestCount();
  assertBudget(dailyUsed, 1);

  let fixtures: ApiFootballFixture[] = [];
  let endpoint = "";

  switch (mode) {
    case "full":
      fixtures = await fetchAllWorldCupFixtures();
      endpoint = `fixtures?league=1&season=2026`;
      break;
    case "live":
      fixtures = await fetchLiveWorldCupFixtures();
      endpoint = "fixtures?live=all";
      break;
    case "today":
    default:
      fixtures = await fetchRecentAndUpcomingFixtures();
      endpoint = "fixtures?league=1&season=2026&from=yesterday&to=tomorrow";
      break;
  }

  const matchesUpserted = await upsertFixtures(fixtures);
  await logSync(endpoint, 1, matchesUpserted);

  const dailyRequestsSoFar = dailyUsed + 1;

  return {
    mode,
    requestsUsed: 1,
    matchesUpserted,
    dailyRequestsSoFar,
    remainingBudget: getDailyRequestLimit() - dailyRequestsSoFar,
  };
}

export async function syncMatchesSmart(): Promise<SyncResult> {
  return syncMatches("today");
}

export interface MatchSyncStatus {
  source: "worldcup2026" | "api-football" | "seed";
  apiConfigured: boolean;
  seasonBlocked: boolean;
  dailyUsed: number;
  dailyLimit: number;
  remainingRequests: number;
  usesFreeFeed: boolean;
}

export async function getMatchSyncStatus(): Promise<MatchSyncStatus> {
  const dailyLimit = getDailyRequestLimit();
  const dailyUsed = await getDailyRequestCount();
  const apiConfigured = !!process.env.API_FOOTBALL_KEY;
  const seasonBlocked = await isApiSeasonBlocked();
  const usesFreeFeed = !apiConfigured || seasonBlocked;

  return {
    source: usesFreeFeed ? "worldcup2026" : "api-football",
    apiConfigured,
    seasonBlocked,
    dailyUsed,
    dailyLimit,
    remainingRequests: usesFreeFeed
      ? -1
      : Math.max(0, dailyLimit - dailyUsed),
    usesFreeFeed,
  };
}

export type RefreshMatchesOutcome =
  | {
      ok: true;
      source: "worldcup2026" | "api-football";
      matchesUpserted: number;
      remainingRequests: number;
    }
  | {
      ok: false;
      code:
        | "no_api"
        | "no_admin"
        | "season_blocked"
        | "limit_exceeded"
        | "rate_limit"
        | "error";
      message: string;
    };

export async function refreshMatchesFromApi(): Promise<RefreshMatchesOutcome> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      code: "no_admin",
      message:
        "Server sync is not configured. Add SUPABASE_SERVICE_ROLE_KEY to refresh matches.",
    };
  }

  try {
    const result = await syncWorldCup2026Matches();
    return {
      ok: true,
      source: "worldcup2026",
      matchesUpserted: result.matchesUpserted,
      remainingRequests: -1,
    };
  } catch (error) {
    if (error instanceof WorldCup2026Error && error.code === "rate_limit") {
      return {
        ok: false,
        code: "rate_limit",
        message: error.message,
      };
    }

    const canUseApiFootball =
      !!process.env.API_FOOTBALL_KEY && !(await isApiSeasonBlocked());

    if (!canUseApiFootball) {
      return {
        ok: false,
        code: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to refresh matches from the free World Cup 2026 feed.",
      };
    }

    const dailyUsed = await getDailyRequestCount();
    const limit = getDailyRequestLimit();
    if (dailyUsed >= limit) {
      return {
        ok: false,
        code: "limit_exceeded",
        message: `Daily API-Football limit reached (${limit}/${limit}). Please wait until tomorrow to fetch updated match results.`,
      };
    }

    try {
      const result = await syncMatches("today");
      return {
        ok: true,
        source: "api-football",
        matchesUpserted: result.matchesUpserted,
        remainingRequests: result.remainingBudget,
      };
    } catch (apiError) {
      if (isSeasonRestrictedError(apiError)) {
        await markApiSeasonBlocked();
        return {
          ok: false,
          code: "season_blocked",
          message:
            "World Cup 2026 is not available on the free API-Football plan.",
        };
      }

      return {
        ok: false,
        code: "error",
        message:
          apiError instanceof Error
            ? apiError.message
            : "Failed to refresh matches.",
      };
    }
  }
}

async function getMatchCount(): Promise<number> {
  const supabase = await getAdminSupabase();
  if (!supabase) return 0;

  const { count } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true });

  return count ?? 0;
}

/**
 * Sync on login — 1 API request per login, never throws.
 *
 * Budget: 100 requests/day on the free API-Football plan.
 * With <100 logins/day each user login triggers one sync.
 *
 * Free plans only cover seasons 2022–2024, so WC 2026 falls back
 * to built-in seed data automatically after the first failed attempt.
 */
export async function syncMatchesOnLogin(): Promise<void> {
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await syncWorldCup2026Matches();
        return;
      } catch (error) {
        if (error instanceof WorldCup2026Error && error.code === "rate_limit") {
          console.warn("World Cup 2026 sync skipped:", error.message);
        } else {
          console.error("World Cup 2026 sync failed:", error);
        }
      }
    }

    if (!process.env.API_FOOTBALL_KEY) {
      await seedMatchesIfEmpty();
      return;
    }

    if (await isApiSeasonBlocked()) {
      await seedMatchesIfEmpty();
      return;
    }

    const dailyUsed = await getDailyRequestCount();
    if (dailyUsed >= getDailyRequestLimit()) {
      console.warn(`Match sync skipped: daily limit reached (${dailyUsed}/100)`);
      await seedMatchesIfEmpty();
      return;
    }

    const matchCount = await getMatchCount();
    const mode: SyncMode = matchCount === 0 ? "full" : "today";

    try {
      await syncMatches(mode);
    } catch (error) {
      if (isSeasonRestrictedError(error)) {
        await markApiSeasonBlocked();
        await seedMatchesIfEmpty();
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error("Match sync on login failed:", error);
    try {
      await seedMatchesIfEmpty();
    } catch {
      // Dashboard must still load even if seeding fails
    }
  }
}
