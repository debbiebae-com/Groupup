"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { VerificationBadge } from "@/components/auth/VerificationBadge";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profiles", label: "Profiles" },
  { href: "/groups", label: "Groups" },
  { href: "/swipe", label: "Swipe" },
];

export function Navbar() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            GroupUp
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <VerificationBadge />
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
            {user?.displayName?.slice(0, 1) ?? "?"}
          </div>
        </div>
      </div>
    </header>
  );
}
