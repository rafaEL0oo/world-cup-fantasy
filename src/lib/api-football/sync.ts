import { createAdminClient } from "@/lib/supabase/admin";
import { seedMatchesIfEmpty } from "@/lib/matches/seed-matches";
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
