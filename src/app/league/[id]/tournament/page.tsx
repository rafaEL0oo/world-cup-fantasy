import { requireUser } from "@/lib/auth";
import { getLeague, requireLeagueMember } from "@/lib/leagues";
import {
  getTeamsFromMatches,
  getTournamentStartTime,
  isTournamentStarted,
} from "@/lib/matches";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { LeagueNav } from "@/components/layout/league-nav";
import { TournamentForm } from "@/components/tournament/tournament-form";
import type { Match, TournamentPrediction } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TournamentPage({ params }: PageProps) {
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
  const teams = getTeamsFromMatches(allMatches);
  const tournamentStarted = isTournamentStarted(allMatches);
  const tournamentStart = getTournamentStartTime(allMatches);

  const { data: existing } = await supabase
    .from("tournament_predictions")
    .select("*")
    .eq("league_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <AppShell user={{ email: user.email }}>
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Tournament predictions
            </h1>
            <p className="text-muted-foreground">
              {league.name} — pick the champion before kickoff
            </p>
          </div>
          <LeagueNav leagueId={id} />
        </div>

        <TournamentForm
          leagueId={id}
          teams={teams}
          existing={existing as TournamentPrediction | null}
          locked={tournamentStarted}
          tournamentStartAt={tournamentStart?.toISOString() ?? null}
        />
      </div>
    </AppShell>
  );
}
