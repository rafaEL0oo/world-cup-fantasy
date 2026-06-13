import { Clock } from "lucide-react";
import { formatKickoffCEST, formatKickoffDateShortCEST } from "@/lib/dates";
import type { Match } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface MatchResultPrediction {
  userId: string;
  username: string | null;
  predictedHome: number;
  predictedAway: number;
  points: number;
}

interface MatchResultsTableProps {
  matches: Match[];
  predictionsByMatch: Map<string, MatchResultPrediction[]>;
  currentUserId: string;
}

function getStatusBadge(match: Match) {
  if (match.status === "finished") {
    return <Badge>Finished</Badge>;
  }
  if (match.status === "live") {
    return (
      <Badge className="bg-red-600 text-white hover:bg-red-600">Live</Badge>
    );
  }
  return <Badge variant="outline">Scheduled</Badge>;
}

function getResultScore(match: Match) {
  if (match.status === "finished" || match.status === "live") {
    if (match.home_score !== null && match.away_score !== null) {
      return (
        <span className="text-lg font-bold tabular-nums">
          {match.home_score} – {match.away_score}
        </span>
      );
    }
  }

  return <span className="text-sm text-muted-foreground">—</span>;
}

export function MatchResultsTable({
  matches,
  predictionsByMatch,
  currentUserId,
}: MatchResultsTableProps) {
  if (!matches.length) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No matches available yet.
      </p>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Match</TableHead>
            <TableHead className="hidden sm:table-cell">Round</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Kickoff (CEST)</TableHead>
            <TableHead className="text-right">Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => {
            const predictions = predictionsByMatch.get(match.id) ?? [];

            return (
              <TableRow key={match.id}>
                <TableCell>
                  <div className="font-medium">
                    {match.home_team} vs {match.away_team}
                  </div>
                  <div className="text-xs text-muted-foreground sm:hidden">
                    {match.round ?? formatKickoffDateShortCEST(match.kickoff_at)}
                  </div>
                  {predictions.length > 0 ? (
                    <div className="mt-2 space-y-1 border-t pt-2">
                      {predictions.map((prediction) => (
                        <div
                          key={prediction.userId}
                          className="flex flex-wrap items-center gap-x-2 text-xs"
                        >
                          <span
                            className={
                              prediction.userId === currentUserId
                                ? "font-medium text-foreground"
                                : "text-muted-foreground"
                            }
                          >
                            {prediction.username ?? "Player"}
                            {prediction.userId === currentUserId ? " (you)" : ""}
                          </span>
                          <span className="font-medium tabular-nums">
                            {prediction.predictedHome}–{prediction.predictedAway}
                          </span>
                          {match.status === "finished" && (
                            <span className="text-muted-foreground">
                              {prediction.points} pts
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      No predictions yet
                    </p>
                  )}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {match.round ?? "—"}
                </TableCell>
                <TableCell>{getStatusBadge(match)}</TableCell>
                <TableCell className="text-right">
                  <span className="flex items-center justify-end gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-3.5 shrink-0" />
                    {formatKickoffCEST(match.kickoff_at)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {getResultScore(match)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
