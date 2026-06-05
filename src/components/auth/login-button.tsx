"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LoginButton() {
  async function handleLogin() {
    const supabase = createClient();
    // Always match the URL in the browser to avoid localhost vs 127.0.0.1 mismatches.
    const redirectTo = `${window.location.origin}/auth/callback`;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });
  }

  return (
    <Button size="lg" className="w-full" onClick={handleLogin}>
      Continue with Google
    </Button>
  );
}
