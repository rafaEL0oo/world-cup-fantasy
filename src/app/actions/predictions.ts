"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/app/actions/leagues";

export async function savePrediction(
  leagueId: string,
  matchId: string,
  predictedHome: number,
  predictedAway: number
): Promise<ActionResult> {
  if (predictedHome < 0 || predictedAway < 0) {
    return { error: "Scores cannot be negative." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("kickoff_at, status")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    return { error: "Match not found." };
  }

  if (new Date(match.kickoff_at) <= new Date()) {
    return { error: "Predictions are locked after kickoff." };
  }

  const { data: existing } = await supabase
    .from("predictions")
    .select("id")
    .eq("user_id", user.id)
    .eq("league_id", leagueId)
    .eq("match_id", matchId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("predictions")
      .update({
        predicted_home: predictedHome,
        predicted_away: predictedAway,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("predictions").insert({
      user_id: user.id,
      league_id: leagueId,
      match_id: matchId,
      predicted_home: predictedHome,
      predicted_away: predictedAway,
    });

    if (error) return { error: error.message };
  }

  revalidatePath(`/league/${leagueId}/predictions`);
  revalidatePath(`/league/${leagueId}/leaderboard`);
  return { success: true };
}
