import { createAdminClient } from "@/lib/supabase/admin";
import { fetchWorldCup2026Games, WorldCup2026Error } from "./client";
import { mapGameToMatch } from "./mappers";
import type { WorldCup2026SyncResult } from "./types";

async function cleanupOrphanSeedRows(): Promise<void> {
  const supabase = createAdminClient();

  const { data: predictions } = await supabase
    .from("predictions")
    .select("match_id");

  const usedMatchIds = new Set((predictions ?? []).map((row) => row.match_id));

  const { data: seedRows } = await supabase
    .from("matches")
    .select("id")
    .is("api_football_id", null);

  const orphanIds = (seedRows ?? [])
    .map((row) => row.id)
    .filter((id) => !usedMatchIds.has(id));

  if (!orphanIds.length) return;

  await supabase.from("matches").delete().in("id", orphanIds);
}

async function logSync(matchesUpdated: number) {
  try {
    const supabase = createAdminClient();
    await supabase.from("api_sync_log").insert({
      endpoint: "worldcup2026/get/games",
      requests_used: 0,
      matches_updated: matchesUpdated,
    });
  } catch {
    // Non-fatal — sync still succeeded
  }
}

async function linkLegacySeedRows(
  rows: ReturnType<typeof mapGameToMatch>[]
): Promise<void> {
  const supabase = createAdminClient();

  for (const row of rows) {
    if (row.home_team.startsWith("TBD") || row.away_team.startsWith("TBD")) {
      continue;
    }

    await supabase
      .from("matches")
      .update({
        api_football_id: row.api_football_id,
        home_score: row.home_score,
        away_score: row.away_score,
        status: row.status,
        kickoff_at: row.kickoff_at,
        round: row.round,
        stage: row.stage,
        last_synced_at: row.last_synced_at,
      })
      .eq("home_team", row.home_team)
      .eq("away_team", row.away_team)
      .is("api_football_id", null);
  }
}

export async function syncWorldCup2026Matches(): Promise<WorldCup2026SyncResult> {
  const { games, stadiums } = await fetchWorldCup2026Games();

  if (!games.length) {
    throw new WorldCup2026Error("No World Cup 2026 matches returned from the feed.");
  }

  const supabase = createAdminClient();
  const rows = games.map((game) => mapGameToMatch(game, stadiums));

  const { data: upserted, error: rpcError } = await supabase.rpc(
    "bulk_upsert_matches",
    { p_rows: rows }
  );

  if (rpcError) {
    const { error: directError } = await supabase
      .from("matches")
      .upsert(rows, { onConflict: "api_football_id" });

    if (directError) {
      throw new Error(
        `Failed to upsert World Cup 2026 matches: ${rpcError.message}. ` +
          `Also tried direct upsert: ${directError.message}. ` +
          `Run supabase/fix-all-rls.sql in the Supabase SQL editor and ensure ` +
          `SUPABASE_SERVICE_ROLE_KEY is set on Vercel.`
      );
    }
  }

  const matchCount = typeof upserted === "number" ? upserted : rows.length;

  await linkLegacySeedRows(rows);
  await cleanupOrphanSeedRows();
  await logSync(matchCount);

  return {
    source: "worldcup2026",
    requestsUsed: 0,
    matchesUpserted: matchCount,
  };
}

export { WorldCup2026Error };
