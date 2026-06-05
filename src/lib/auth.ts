import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

/** Creates a profile row if the user signed up before the DB trigger existed. */
export async function ensureProfile(user: User): Promise<Profile | null> {
  const supabase = await createClient();

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing;

  if (selectError) {
    console.error("Profile lookup failed:", selectError.message);
  }

  const username =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Player";

  const { error: insertError } = await supabase.from("profiles").insert({
    id: user.id,
    username,
    avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
  });

  if (insertError && insertError.code !== "23505") {
    // Profile may already exist from SQL backfill — retry read
    const { data: retry } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (retry) return retry;
    throw new Error(`Failed to create profile: ${insertError.message}`);
  }

  const { data: created } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return created;
}
