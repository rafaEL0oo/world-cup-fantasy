import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncMatches } from "@/lib/api-football/sync";
import type { SyncMode } from "@/lib/api-football/types";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = (searchParams.get("mode") ?? "full") as SyncMode;
  const clearSeed = searchParams.get("clearSeed") === "true";

  if (!["full", "today", "live"].includes(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  try {
    if (clearSeed && mode === "full") {
      const supabase = createAdminClient();
      await supabase
        .from("matches")
        .delete()
        .is("api_football_id", null);
    }

    const result = await syncMatches(mode);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
