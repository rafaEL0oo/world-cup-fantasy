"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const oauthError =
      searchParams.get("error_description") ?? searchParams.get("error");

    if (!code) {
      const message =
        oauthError ??
        "No authorization code returned. Check Supabase redirect URLs.";
      router.replace(
        `/login?error=auth&message=${encodeURIComponent(message)}`
      );
      return;
    }

    const supabase = createClient();

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        router.replace(
          `/login?error=auth&message=${encodeURIComponent(error.message)}`
        );
      } else {
        router.replace("/dashboard");
      }
    });
  }, [router, searchParams]);

  return (
    <p className="text-muted-foreground">Signing you in...</p>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
        <AuthCallbackHandler />
      </Suspense>
    </div>
  );
}
