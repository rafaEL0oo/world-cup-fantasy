import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { League, LeaderboardEntry } from "@/types/database";

export async function getUserLeagues(userId: string): Promise<League[]> {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id")
    .eq("user_id", userId);

  if (!memberships?.length) return [];

  const leagueIds = memberships.map((m) => m.league_id);

  const { data: leagues } = await supabase
    .from("leagues")
    .select("*")
    .in("id", leagueIds)
    .order("created_at", { ascending: false });

  return leagues ?? [];
}

export async function getLeague(leagueId: string): Promise<League | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", leagueId)
    .single();
  return data;
}

export async function requireLeagueMember(leagueId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("league_members")
    .select("league_id")
    .eq("league_id", leagueId)
    .eq("user_id", userId)
    .single();

  if (!data) {
    redirect("/dashboard");
  }
}

export async function getLeagueLeaderboard(
  leagueId: string
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, profiles(id, username, avatar_url)")
    .eq("league_id", leagueId);

  if (!members?.length) return [];

  const { data: predictions } = await supabase
    .from("predictions")
    .select("user_id, points")
    .eq("league_id", leagueId);

  const pointsByUser = new Map<string, { total: number; count: number }>();

  for (const member of members) {
    pointsByUser.set(member.user_id, { total: 0, count: 0 });
  }

  for (const prediction of predictions ?? []) {
    const current = pointsByUser.get(prediction.user_id);
    if (current) {
      current.total += prediction.points;
      current.count += 1;
    }
  }

  const entries: LeaderboardEntry[] = members.map((member) => {
    const profile = member.profiles as unknown as {
      id: string;
      username: string | null;
      avatar_url: string | null;
    } | null;
    const stats = pointsByUser.get(member.user_id) ?? { total: 0, count: 0 };

    return {
      user_id: member.user_id,
      username: profile?.username ?? null,
      avatar_url: profile?.avatar_url ?? null,
      total_points: stats.total,
      predictions_count: stats.count,
    };
  });

  return entries.sort((a, b) => b.total_points - a.total_points);
}
