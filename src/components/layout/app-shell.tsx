import Link from "next/link";
import { Trophy } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    email?: string;
    avatarUrl?: string | null;
    username?: string | null;
  };
}

export function AppShell({ children, user }: AppShellProps) {
  const initials =
    user?.username?.slice(0, 2).toUpperCase() ??
    user?.email?.slice(0, 2).toUpperCase() ??
    "WC";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Trophy className="size-4" />
            </div>
            <span className="hidden sm:inline">World Cup Predictor League</span>
            <span className="sm:hidden">WC Predictor</span>
          </Link>

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                <Avatar className="size-7">
                  <AvatarImage src={user.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {user.username ?? user.email}
                </span>
              </div>
              <SignOutButton />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
