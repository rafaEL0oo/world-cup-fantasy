"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/auth";
import { generateInviteCode } from "@/lib/invite-code";

export type ActionResult = { error?: string; success?: boolean };

export async function createLeague(name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) {
    return { error: "League name must be at least 2 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  try {
    await ensureProfile(user);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to set up your profile.",
    };
  }

  let inviteCode = generateInviteCode();
  let attempts = 0;

  while (attempts < 5) {
    const { data: leagueId, error } = await supabase.rpc("create_league", {
      p_name: trimmed,
      p_invite_code: inviteCode,
    });

    if (!error && leagueId) {
      revalidatePath("/dashboard");
      redirect(`/league/${leagueId}`);
    }

    if (
      error?.message?.includes("duplicate") ||
      error?.message?.includes("unique") ||
      error?.code === "23505"
    ) {
      inviteCode = generateInviteCode();
      attempts++;
      continue;
    }

    return { error: error?.message ?? "Failed to create league." };
  }

  return { error: "Could not generate a unique invite code. Try again." };
}

export async function joinLeague(inviteCode: string): Promise<ActionResult> {
  const code = inviteCode.trim().toUpperCase();
  if (!code) {
    return { error: "Enter an invite code." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  try {
    await ensureProfile(user);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to set up your profile.",
    };
  }

  const { data: leagueId, error: joinError } = await supabase.rpc(
    "join_league_by_invite",
    { p_invite_code: code }
  );

  if (joinError) {
    const message = joinError.message.includes("Invalid invite code")
      ? "Invalid invite code."
      : joinError.message;
    return { error: message };
  }

  if (!leagueId) {
    return { error: "Invalid invite code." };
  }

  revalidatePath("/dashboard");
  redirect(`/league/${leagueId}`);
}
