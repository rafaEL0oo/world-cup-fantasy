"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { refreshMatches } from "@/app/actions/matches";
import { Button } from "@/components/ui/button";

interface RefreshMatchesButtonProps {
  leagueId?: string;
  usesFreeFeed: boolean;
  remainingRequests: number;
}

export function RefreshMatchesButton({
  leagueId,
  usesFreeFeed,
  remainingRequests,
}: RefreshMatchesButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(async () => {
      const result = await refreshMatches(leagueId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      const updated = result.matchesUpdated ?? 0;
      const left = result.remainingRequests ?? 0;
      const sourceLabel =
        result.source === "worldcup2026" ? "World Cup 2026 API" : "API-Football";

      if (updated > 0) {
        toast.success(
          usesFreeFeed
            ? `Updated ${updated} match${updated === 1 ? "" : "es"} from ${sourceLabel}.`
            : `Updated ${updated} match${updated === 1 ? "" : "es"}. ${left} API-Football request${left === 1 ? "" : "s"} left today.`
        );
      } else {
        toast.success(
          usesFreeFeed
            ? `Scores are up to date (${sourceLabel}).`
            : `No score changes found. ${left} API-Football request${left === 1 ? "" : "s"} left today.`
        );
      }

      router.refresh();
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isPending}
      title={
        usesFreeFeed
          ? "Fetch latest scores from the free World Cup 2026 API"
          : remainingRequests > 0
            ? `${remainingRequests} API-Football request${remainingRequests === 1 ? "" : "s"} left today`
            : "Daily API-Football limit reached — try again tomorrow"
      }
    >
      <RefreshCw
        className={isPending ? "animate-spin" : undefined}
        data-icon="inline-start"
      />
      {isPending ? "Updating..." : "Refresh matches"}
    </Button>
  );
}
