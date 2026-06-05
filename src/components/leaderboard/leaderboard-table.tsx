import { Medal } from "lucide-react";
import type { LeaderboardEntry } from "@/types/database";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

function getRankStyle(rank: number) {
  if (rank === 1) return "text-amber-500";
  if (rank === 2) return "text-slate-400";
  if (rank === 3) return "text-amber-700";
  return "text-muted-foreground";
}

export function LeaderboardTable({
  entries,
  currentUserId,
}: LeaderboardTableProps) {
  if (!entries.length) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No members yet. Share the invite code to get started.
      </p>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">Predictions</TableHead>
            <TableHead className="text-right">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => {
            const rank = index + 1;
            const initials =
              entry.username?.slice(0, 2).toUpperCase() ?? "??";
            const isCurrentUser = entry.user_id === currentUserId;

            return (
              <TableRow
                key={entry.user_id}
                className={isCurrentUser ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""}
              >
                <TableCell>
                  <span className={`flex items-center gap-1 font-semibold ${getRankStyle(rank)}`}>
                    {rank <= 3 && <Medal className="size-4" />}
                    {rank}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src={entry.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {entry.username ?? "Unknown player"}
                      </span>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {entry.predictions_count}
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-lg font-bold tabular-nums text-emerald-600">
                    {entry.total_points}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
