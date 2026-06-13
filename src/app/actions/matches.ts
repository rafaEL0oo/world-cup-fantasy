"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { refreshMatchesFromApi } from "@/lib/api-football/sync";
import type { ActionResult } from "@/app/actions/leagues";

export type RefreshMatchesResult = ActionResult & {
  matchesUpdated?: number;
  remainingRequests?: number;
  source?: "worldcup2026" | "api-football";
};

export async function refreshMatches(
  leagueId?: string
): Promise<RefreshMatchesResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const outcome = await refreshMatchesFromApi();

  if (!outcome.ok) {
    return { error: outcome.message };
  }

  if (leagueId) {
    revalidatePath(`/league/${leagueId}/predictions`);
    revalidatePath(`/league/${leagueId}/results`);
  }
  revalidatePath("/dashboard");

  return {
    success: true,
    matchesUpdated: outcome.matchesUpserted,
    remainingRequests: outcome.remainingRequests,
    source: outcome.source,
  };
}
