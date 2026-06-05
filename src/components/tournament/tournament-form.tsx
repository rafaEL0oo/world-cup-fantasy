"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { saveTournamentPrediction } from "@/app/actions/tournament";
import type { TournamentPrediction } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TEAMS = [
  "Argentina", "Brazil", "France", "Germany", "Spain", "England",
  "Portugal", "Netherlands", "Belgium", "USA", "Mexico", "Canada",
  "Morocco", "Japan", "Croatia", "Uruguay", "Colombia", "Poland",
];

const schema = z.object({
  winner: z.string().min(1, "Select a winner"),
  runnerUp: z.string().min(1, "Select a runner-up"),
  topScorer: z.string().min(2, "Enter a player name"),
});

type FormValues = z.infer<typeof schema>;

interface TournamentFormProps {
  leagueId: string;
  existing?: TournamentPrediction | null;
}

export function TournamentForm({ leagueId, existing }: TournamentFormProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournament predictions</CardTitle>
        <p className="text-sm text-muted-foreground">
          Pick the champion, runner-up, and top scorer before the tournament kicks off.
        </p>
      </CardHeader>
      <CardContent>
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
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                      {...field}
                    >
                      <option value="">Select team</option>
                      {TEAMS.map((team) => (
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
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                      {...field}
                    >
                      <option value="">Select team</option>
                      {TEAMS.map((team) => (
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
                    <Input placeholder="e.g. Kylian Mbappé" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : existing ? "Update predictions" : "Save predictions"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
