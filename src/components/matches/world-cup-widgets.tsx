"use client";

import Script from "next/script";

interface WorldCupWidgetsProps {
  showStandings?: boolean;
}

/**
 * API-SPORTS widgets for World Cup 2026 (league=1, season=2026).
 * Note: API-Football free plans only include seasons 2022–2024.
 * WC 2026 widgets require a paid plan — use built-in match data instead.
 */
export function WorldCupWidgets({ showStandings = false }: WorldCupWidgetsProps) {
  const apiKey = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY;
  const widgetsEnabled = process.env.NEXT_PUBLIC_ENABLE_API_FOOTBALL_WIDGETS === "true";

  if (!apiKey || !widgetsEnabled) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Live widgets require a paid API-Football plan for the 2026 season.
        Match data is loaded from the built-in fixture list below.
        {" "}
        Set <code className="text-xs">NEXT_PUBLIC_ENABLE_API_FOOTBALL_WIDGETS=true</code>{" "}
        after upgrading your plan.
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-hidden rounded-lg border bg-card p-4">
      <Script
        src="https://widgets.api-sports.io/3.1.0/widgets.js"
        type="module"
        strategy="afterInteractive"
      />

      <api-sports-widget
        data-type="config"
        data-sport="football"
        data-key={apiKey}
        data-lang="en"
        data-theme="grey"
        data-show-error="false"
        data-show-logos="true"
        data-refresh="60"
        data-tab="games"
        data-game-tab="statistics"
      />

      <api-sports-widget
        data-type="games"
        data-sport="football"
        data-league="1"
        data-season="2026"
      />

      {showStandings && (
        <api-sports-widget
          data-type="standings"
          data-sport="football"
          data-league="1"
          data-season="2026"
        />
      )}
    </div>
  );
}
