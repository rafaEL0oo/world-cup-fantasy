import { createAdminClient } from "@/lib/supabase/admin";
import { WORLD_CUP_2026_SEED } from "./seed-data";

export async function seedMatchesIfEmpty(): Promise<number> {
  const supabase = createAdminClient();

  const { count } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) return 0;

  const { error } = await supabase.from("matches").insert(WORLD_CUP_2026_SEED);

  if (error) {
    throw new Error(`Failed to seed matches: ${error.message}`);
  }

  return WORLD_CUP_2026_SEED.length;
}
