"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isTournamentStarted } from "@/lib/matches";
import type { Match } from "@/types/database";
import type { ActionResult } from "@/app/actions/leagues";

interface TournamentInput {
  leagueId: string;
  winner: string;
  runnerUp: string;
  topScorer: string;
}

export async function saveTournamentPrediction(
  input: TournamentInput
): Promise<ActionResult> {
  const winner = input.winner.trim();
  const runnerUp = input.runnerUp.trim();
  const topScorer = input.topScorer.trim();

  if (!winner || !runnerUp || !topScorer) {
    return { error: "All fields are required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("kickoff_at, round")
    .order("kickoff_at", { ascending: true });

  if (isTournamentStarted((matches ?? []) as Match[])) {
    return {
      error: "Tournament predictions are locked — the tournament has started.",
    };
  }

  const { data: existing } = await supabase
    .from("tournament_predictions")
    .select("id")
    .eq("user_id", user.id)
    .eq("league_id", input.leagueId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("tournament_predictions")
      .update({
        winner,
        runner_up: runnerUp,
        top_scorer: topScorer,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("tournament_predictions").insert({
      user_id: user.id,
      league_id: input.leagueId,
      winner,
      runner_up: runnerUp,
      top_scorer: topScorer,
    });

    if (error) return { error: error.message };
  }

  revalidatePath(`/league/${input.leagueId}/tournament`);
  return { success: true };
}
