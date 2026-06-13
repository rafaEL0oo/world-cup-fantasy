import { requireUser } from "@/lib/auth";
import { getLeague, requireLeagueMember } from "@/lib/leagues";
import { getMatchSyncStatus } from "@/lib/api-football/sync";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { LeagueNav } from "@/components/layout/league-nav";
import { MatchResultsTable } from "@/components/matches/match-results-table";
import { RefreshMatchesButton } from "@/components/matches/refresh-matches-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Match } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultsPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();
  await requireLeagueMember(id, user.id);

  const league = await getLeague(id);
  if (!league) return null;

  const supabase = await createClient();
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true });

  const allMatches = (matches ?? []) as Match[];
  const syncStatus = await getMatchSyncStatus();

  return (
    <AppShell user={{ email: user.email }}>
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Results</h1>
              <p className="text-muted-foreground">
                {league.name} — all matches with scores or kickoff times
              </p>
            </div>
            <RefreshMatchesButton
              leagueId={id}
              usesFreeFeed={syncStatus.usesFreeFeed}
              remainingRequests={syncStatus.remainingRequests}
            />
          </div>
          <LeagueNav leagueId={id} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              All matches ({allMatches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MatchResultsTable matches={allMatches} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
