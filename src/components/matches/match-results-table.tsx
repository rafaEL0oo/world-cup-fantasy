import { format } from "date-fns";
import { Clock } from "lucide-react";
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

interface MatchResultsTableProps {
  matches: Match[];
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

function getScoreOrKickoff(match: Match) {
  if (match.status === "finished" || match.status === "live") {
    if (match.home_score !== null && match.away_score !== null) {
      return (
        <span className="text-lg font-bold tabular-nums">
          {match.home_score} – {match.away_score}
        </span>
      );
    }
  }

  return (
    <span className="flex items-center justify-end gap-1.5 text-sm text-muted-foreground">
      <Clock className="size-3.5" />
      {format(new Date(match.kickoff_at), "EEE, MMM d · HH:mm")}
    </span>
  );
}

export function MatchResultsTable({ matches }: MatchResultsTableProps) {
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
            <TableHead className="text-right">Score / Kickoff</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => (
            <TableRow key={match.id}>
              <TableCell>
                <div className="font-medium">
                  {match.home_team} vs {match.away_team}
                </div>
                <div className="text-xs text-muted-foreground sm:hidden">
                  {match.round ?? format(new Date(match.kickoff_at), "MMM d")}
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {match.round ?? "—"}
              </TableCell>
              <TableCell>{getStatusBadge(match)}</TableCell>
              <TableCell className="text-right">
                {getScoreOrKickoff(match)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
