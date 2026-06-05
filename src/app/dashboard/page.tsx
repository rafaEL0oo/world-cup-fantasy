import { syncMatchesOnLogin } from "@/lib/api-football/sync";
import { requireUser, getProfile, ensureProfile } from "@/lib/auth";
import { getUserLeagues } from "@/lib/leagues";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { CreateLeagueForm } from "@/components/leagues/create-league-form";
import { JoinLeagueForm } from "@/components/leagues/join-league-form";
import { LeagueCard } from "@/components/leagues/league-card";

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = (await getProfile(user.id)) ?? (await ensureProfile(user));

  // Sync match data on login (1 API request per login, max 100/day)
  await syncMatchesOnLogin();

  const leagues = await getUserLeagues(user.id);

  const supabase = await createClient();
  const memberCounts = await Promise.all(
    leagues.map(async (league) => {
      const { count } = await supabase
        .from("league_members")
        .select("*", { count: "exact", head: true })
        .eq("league_id", league.id);
      return { leagueId: league.id, count: count ?? 0 };
    })
  );

  const countMap = Object.fromEntries(
    memberCounts.map((m) => [m.leagueId, m.count])
  );

  return (
    <AppShell
      user={{
        email: user.email,
        avatarUrl: profile?.avatar_url,
        username: profile?.username,
      }}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Your leagues</h1>
            <p className="text-muted-foreground">
              Create a private league or join one with an invite code.
            </p>
          </div>
          <div className="flex gap-2">
            <JoinLeagueForm />
            <CreateLeagueForm />
          </div>
        </div>

        {leagues.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <p className="text-lg font-medium">No leagues yet</p>
            <p className="mt-1 text-muted-foreground">
              Create your first league and invite friends to compete.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {leagues.map((league) => (
              <LeagueCard
                key={league.id}
                league={league}
                memberCount={countMap[league.id]}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
