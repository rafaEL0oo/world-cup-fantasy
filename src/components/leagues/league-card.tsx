import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight, Users } from "lucide-react";
import type { League } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LeagueCardProps {
  league: League;
  memberCount?: number;
}

export function LeagueCard({ league, memberCount }: LeagueCardProps) {
  return (
    <Link href={`/league/${league.id}`}>
      <Card className="transition-colors hover:border-emerald-600/50 hover:bg-muted/30">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">{league.name}</CardTitle>
          <ChevronRight className="size-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="font-mono">
            {league.invite_code}
          </Badge>
          {memberCount !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {memberCount} members
            </span>
          )}
          <span>Created {format(new Date(league.created_at), "MMM d, yyyy")}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
