import { createAdminClient } from "@/lib/supabase/admin";
import { fetchWorldCup2026Games, WorldCup2026Error } from "./client";
import { mapGameToMatch } from "./mappers";
import type { WorldCup2026SyncResult } from "./types";

/** Old seed names → worldcup26.ir names (keeps predictions on the same match row). */
const TEAM_ALIASES: Record<string, string> = {
  "UEFA Playoff D": "Czech Republic",
  "UEFA Playoff A": "Bosnia and Herzegovina",
  "UEFA Playoff C": "Turkey",
  "UEFA Playoff B": "Wales",
  "UEFA Playoff Path": "Denmark",
  USA: "United States",
};

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

function teamVariants(canonical: string): string[] {
  const aliases = Object.entries(TEAM_ALIASES)
    .filter(([, name]) => name === canonical)
    .map(([alias]) => alias);

  return [canonical, ...aliases];
}

/** Update old seed rows in place BEFORE upsert so predictions keep the same match_id. */
async function linkLegacySeedRows(
  rows: ReturnType<typeof mapGameToMatch>[]
): Promise<void> {
  const supabase = createAdminClient();

  for (const row of rows) {
    if (row.home_team.startsWith("TBD") || row.away_team.startsWith("TBD")) {
      continue;
    }

    for (const home of teamVariants(row.home_team)) {
      for (const away of teamVariants(row.away_team)) {
        await supabase
          .from("matches")
          .update({
            api_football_id: row.api_football_id,
            home_team: row.home_team,
            away_team: row.away_team,
            home_score: row.home_score,
            away_score: row.away_score,
            status: row.status,
            kickoff_at: row.kickoff_at,
            round: row.round,
            stage: row.stage,
            last_synced_at: row.last_synced_at,
          })
          .eq("home_team", home)
          .eq("away_team", away)
          .is("api_football_id", null);
      }
    }
  }
}

export async function syncWorldCup2026Matches(): Promise<WorldCup2026SyncResult> {
  const { games, stadiums } = await fetchWorldCup2026Games();

  if (!games.length) {
    throw new WorldCup2026Error("No World Cup 2026 matches returned from the feed.");
  }

  const supabase = createAdminClient();
  const rows = games.map((game) => mapGameToMatch(game, stadiums));

  // Link seed rows first — preserves prediction match_id references
  await linkLegacySeedRows(rows);

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
  await logSync(matchCount);

  return {
    source: "worldcup2026",
    requestsUsed: 0,
    matchesUpserted: matchCount,
  };
}

export { WorldCup2026Error };
