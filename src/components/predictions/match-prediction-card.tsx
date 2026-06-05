"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { Lock, Save } from "lucide-react";
import { savePrediction } from "@/app/actions/predictions";
import type { Match, Prediction } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  predictedHome: z.number().min(0).max(20),
  predictedAway: z.number().min(0).max(20),
});

type FormValues = z.infer<typeof schema>;

interface MatchPredictionCardProps {
  leagueId: string;
  match: Match;
  prediction?: Prediction | null;
}

export function MatchPredictionCard({
  leagueId,
  match,
  prediction,
}: MatchPredictionCardProps) {
  const [pending, startTransition] = useTransition();
  const isLocked = new Date(match.kickoff_at) <= new Date();
  const isFinished = match.status === "finished";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      predictedHome: prediction?.predicted_home ?? 0,
      predictedAway: prediction?.predicted_away ?? 0,
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await savePrediction(
        leagueId,
        match.id,
        values.predictedHome,
        values.predictedAway
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Prediction saved");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <p className="font-semibold">
            {match.home_team} vs {match.away_team}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(match.kickoff_at), "EEE, MMM d · HH:mm")}
          </p>
        </div>
        <Badge
          variant={
            isFinished ? "default" : isLocked ? "secondary" : "outline"
          }
        >
          {isFinished ? "Finished" : isLocked ? "Locked" : "Open"}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {isFinished && match.home_score !== null && match.away_score !== null && (
          <div className="rounded-lg bg-muted px-4 py-3 text-center">
            <p className="text-sm text-muted-foreground">Final score</p>
            <p className="text-2xl font-bold tabular-nums">
              {match.home_score} – {match.away_score}
            </p>
            {prediction && (
              <p className="mt-1 text-sm text-emerald-600">
                Your prediction: {prediction.predicted_home}–
                {prediction.predicted_away} · {prediction.points} pts
              </p>
            )}
          </div>
        )}

        {prediction && !isFinished && (
          <p className="text-sm text-muted-foreground">
            Your prediction:{" "}
            <span className="font-medium text-foreground">
              {prediction.predicted_home}–{prediction.predicted_away}
            </span>
          </p>
        )}

        {isLocked ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-4" />
            Predictions locked after kickoff
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex items-end gap-3"
            >
              <FormField
                control={form.control}
                name="predictedHome"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        aria-label={`${match.home_team} score`}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 0)
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {match.home_team}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <span className="pb-6 text-muted-foreground">–</span>
              <FormField
                control={form.control}
                name="predictedAway"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        aria-label={`${match.away_team} score`}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 0)
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {match.away_team}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="sm" disabled={pending} className="mb-5">
                <Save className="size-4" />
                {pending ? "..." : "Save"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
