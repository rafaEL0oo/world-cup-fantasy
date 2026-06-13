"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatKickoffCEST } from "@/lib/dates";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { saveTournamentPrediction } from "@/app/actions/tournament";
import type { TournamentPrediction } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  winner: z.string().min(1, "Select a winner"),
  runnerUp: z.string().min(1, "Select a runner-up"),
  topScorer: z.string().min(2, "Enter a player name"),
});

type FormValues = z.infer<typeof schema>;

interface TournamentFormProps {
  leagueId: string;
  teams: string[];
  existing?: TournamentPrediction | null;
  locked?: boolean;
  tournamentStartAt?: string | null;
}

export function TournamentForm({
  leagueId,
  teams,
  existing,
  locked = false,
  tournamentStartAt,
}: TournamentFormProps) {
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      winner: existing?.winner ?? "",
      runnerUp: existing?.runner_up ?? "",
      topScorer: existing?.top_scorer ?? "",
    },
  });

  function onSubmit(values: FormValues) {
    if (locked) {
      toast.error("Tournament predictions are locked.");
      return;
    }

    if (values.winner === values.runnerUp) {
      toast.error("Winner and runner-up must be different teams.");
      return;
    }

    startTransition(async () => {
      const result = await saveTournamentPrediction({
        leagueId,
        winner: values.winner,
        runnerUp: values.runnerUp,
        topScorer: values.topScorer,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Tournament predictions saved");
      }
    });
  }

  if (!teams.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No teams available yet. Matches must be loaded before tournament
          predictions can be made.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>Tournament predictions</CardTitle>
          <p className="text-sm text-muted-foreground">
            {locked
              ? "Your picks are locked for the rest of the tournament."
              : `Pick the champion, runner-up, and top scorer from ${teams.length} teams. Locks when the tournament starts.`}
          </p>
          {tournamentStartAt && !locked && (
            <p className="text-xs text-muted-foreground">
              Tournament starts{" "}
              {formatKickoffCEST(tournamentStartAt)}
            </p>
          )}
        </div>
        {locked && <Badge variant="secondary">Locked</Badge>}
      </CardHeader>
      <CardContent>
        {locked && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
            <Lock className="size-4 shrink-0" />
            Tournament predictions cannot be changed after the first match
            kicks off
            {tournamentStartAt &&
              ` (${formatKickoffCEST(tournamentStartAt)})`}
            .
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="winner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Winner</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm disabled:opacity-50"
                      disabled={locked}
                      {...field}
                    >
                      <option value="">Select team</option>
                      {teams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="runnerUp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Runner-up</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm disabled:opacity-50"
                      disabled={locked}
                      {...field}
                    >
                      <option value="">Select team</option>
                      {teams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="topScorer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Top scorer</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Kylian Mbappé"
                      disabled={locked}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!locked && (
              <Button type="submit" disabled={pending}>
                {pending
                  ? "Saving..."
                  : existing
                    ? "Update predictions"
                    : "Save predictions"}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
