import Link from "next/link";
import { Target, Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  getLeague,
  getLeagueLeaderboard,
  requireLeagueMember,
} from "@/lib/leagues";
import { AppShell } from "@/components/layout/app-shell";
import { LeagueNav } from "@/components/layout/league-nav";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyInviteButton } from "@/components/leagues/copy-invite-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeaguePage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();
  await requireLeagueMember(id, user.id);

  const league = await getLeague(id);
  if (!league) return null;

  const leaderboard = await getLeagueLeaderboard(id);
  const topThree = leaderboard.slice(0, 3);

  return (
    <AppShell user={{ email: user.email }}>
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{league.name}</h1>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {league.invite_code}
                </Badge>
                <CopyInviteButton code={league.invite_code} />
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/league/${id}/predictions`}>
                <Button>
                  <Target className="size-4" />
                  Make predictions
                </Button>
              </Link>
              <Link href={`/league/${id}/leaderboard`}>
                <Button variant="outline">
                  <Trophy className="size-4" />
                  Full leaderboard
                </Button>
              </Link>
            </div>
          </div>
          <LeagueNav leagueId={id} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top players</CardTitle>
            </CardHeader>
            <CardContent>
              <LeaderboardTable
                entries={topThree}
                currentUserId={user.id}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scoring rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between rounded-lg bg-muted px-4 py-3">
                <span>Exact score</span>
                <span className="font-semibold text-emerald-600">5 pts</span>
              </div>
              <div className="flex justify-between rounded-lg bg-muted px-4 py-3">
                <span>Correct winner or draw</span>
                <span className="font-semibold text-emerald-600">2 pts</span>
              </div>
              <div className="flex justify-between rounded-lg bg-muted px-4 py-3">
                <span>Wrong prediction</span>
                <span className="font-semibold">0 pts</span>
              </div>
              <p className="text-muted-foreground">
                Predictions lock at kickoff. Share invite code{" "}
                <span className="font-mono font-medium text-foreground">
                  {league.invite_code}
                </span>{" "}
                to invite friends.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
