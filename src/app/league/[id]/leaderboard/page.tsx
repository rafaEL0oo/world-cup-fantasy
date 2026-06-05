import { requireUser } from "@/lib/auth";
import { getLeague, getLeagueLeaderboard, requireLeagueMember } from "@/lib/leagues";
import { AppShell } from "@/components/layout/app-shell";
import { LeagueNav } from "@/components/layout/league-nav";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeaderboardPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();
  await requireLeagueMember(id, user.id);

  const league = await getLeague(id);
  if (!league) return null;

  const leaderboard = await getLeagueLeaderboard(id);

  return (
    <AppShell user={{ email: user.email }}>
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
            <p className="text-muted-foreground">
              {league.name} — rankings update when match results are entered
            </p>
          </div>
          <LeagueNav leagueId={id} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>League standings</CardTitle>
          </CardHeader>
          <CardContent>
            <LeaderboardTable
              entries={leaderboard}
              currentUserId={user.id}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
