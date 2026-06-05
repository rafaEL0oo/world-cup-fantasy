import { requireUser } from "@/lib/auth";
import { getLeague, requireLeagueMember } from "@/lib/leagues";
import {
  PREDICTION_LOCK_MINUTES,
  PREDICTION_WINDOW_DAYS,
  splitMatchesForPrediction,
} from "@/lib/matches";
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

  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true });

  const allMatches = (matches ?? []) as Match[];
  const { openNow, comingLater } = splitMatchesForPrediction(allMatches);

  const { data: predictions } = await supabase
    .from("predictions")
    .select("*")
    .eq("league_id", id)
    .eq("user_id", user.id);

  const predictionMap = new Map(
    (predictions ?? []).map((p) => [p.match_id, p as Prediction])
  );

  const hasMatches = openNow.length > 0 || comingLater.length > 0;

  return (
    <AppShell user={{ email: user.email }}>
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Predictions</h1>
            <p className="text-muted-foreground">
              {league.name} — predict from {PREDICTION_WINDOW_DAYS} days before
              kickoff (locks {PREDICTION_LOCK_MINUTES} min before)
            </p>
          </div>
          <LeagueNav leagueId={id} />
        </div>

        {error && (
          <p className="text-sm text-destructive">
            Could not load matches: {error.message}
          </p>
        )}

        {openNow.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              Predict now ({openNow.length})
            </h2>
            <div className="grid gap-4">
              {openNow.map((match) => (
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

        {comingLater.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              Coming up ({comingLater.length})
            </h2>
            <p className="text-sm text-muted-foreground">
              These matches are listed below. You can predict once the{" "}
              {PREDICTION_WINDOW_DAYS}-day window opens.
            </p>
            <div className="grid gap-4">
              {comingLater.map((match) => (
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

        {!hasMatches && (
          <div className="rounded-xl border border-dashed py-12 text-center">
            <p className="text-lg font-medium">No upcoming matches</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {allMatches.length > 0
                ? "All matches have finished. Check the Results page."
                : "No matches in the database yet."}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
