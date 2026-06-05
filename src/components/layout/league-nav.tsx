"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Target, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeagueNavProps {
  leagueId: string;
}

const links = [
  { href: "", label: "Overview", icon: Home },
  { href: "/predictions", label: "Predictions", icon: Target },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { href: "/tournament", label: "Tournament", icon: Trophy },
];

export function LeagueNav({ leagueId }: LeagueNavProps) {
  const pathname = usePathname();
  const base = `/league/${leagueId}`;

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">
      {links.map(({ href, label, icon: Icon }) => {
        const path = `${base}${href}`;
        const isActive =
          href === ""
            ? pathname === base
            : pathname.startsWith(path);

        return (
          <Link
            key={href}
            href={path}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
