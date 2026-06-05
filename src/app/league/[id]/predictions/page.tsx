import { requireUser } from "@/lib/auth";
import { getLeague, requireLeagueMember } from "@/lib/leagues";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { LeagueNav } from "@/components/layout/league-nav";
import { MatchPredictionCard } from "@/components/predictions/match-prediction-card";
import type { Match, Prediction } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PredictionsPage({ params }: PageProps) {
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

  const { data: predictions } = await supabase
    .from("predictions")
    .select("*")
    .eq("league_id", id)
    .eq("user_id", user.id);

  const predictionMap = new Map(
    (predictions ?? []).map((p) => [p.match_id, p as Prediction])
  );

  const upcoming = (matches ?? []).filter(
    (m) => m.status !== "finished"
  ) as Match[];
  const finished = (matches ?? []).filter(
    (m) => m.status === "finished"
  ) as Match[];

  return (
    <AppShell user={{ email: user.email }}>
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Predictions</h1>
            <p className="text-muted-foreground">
              {league.name} — predict scores before kickoff
            </p>
          </div>
          <LeagueNav leagueId={id} />
        </div>

        {upcoming.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Upcoming matches</h2>
            <div className="grid gap-4">
              {upcoming.map((match) => (
                <MatchPredictionCard
                  key={match.id}
                  leagueId={id}
                  match={match}
                  prediction={predictionMap.get(match.id)}
                />
              ))}
            </div>
          </section>
        )}

        {finished.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Finished matches</h2>
            <div className="grid gap-4">
              {finished.map((match) => (
                <MatchPredictionCard
                  key={match.id}
                  leagueId={id}
                  match={match}
                  prediction={predictionMap.get(match.id)}
                />
              ))}
            </div>
          </section>
        )}

        {!matches?.length && (
          <p className="py-12 text-center text-muted-foreground">
            No matches available. Run the seed SQL in Supabase.
          </p>
        )}
      </div>
    </AppShell>
  );
}
