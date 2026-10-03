"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Compass,
  Heart,
  LogOut,
  MessageCircle,
  Search,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { VerificationBadge } from "@/components/auth/VerificationBadge";
import { Photo } from "@/components/shared/Photo";

const navLinks = [
  { href: "/profiles", label: "Discover", icon: Compass },
  { href: "/swipe", label: "Vibe check", icon: Heart },
  { href: "/groups", label: "Your circle", icon: UsersRound },
];

function Brand() {
  return (
    <Link href="/" aria-label="GroupUp home" className="group flex shrink-0 items-center gap-2.5">
      <span className="instagram-gradient grid h-10 w-10 place-items-center rounded-[15px] text-white shadow-[0_5px_14px_rgba(226,67,105,0.22)] transition-transform group-hover:rotate-[-6deg]">
        <UsersRound className="h-[19px] w-[19px] stroke-[2.4]" />
      </span>
      <span className="text-[21px] font-extrabold tracking-[-0.07em] text-[#242221]">
        group<span className="text-gradient">up</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [query, setQuery] = useState("");

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/profiles${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#ece8e5]/90 bg-[#fffdfc]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1380px] items-center justify-between gap-5 px-4 sm:px-6">
          <Brand />

          <form onSubmit={search} className="hidden w-full max-w-[310px] items-center gap-2 rounded-full bg-[#f4f1ef] px-4 py-2.5 md:flex">
            <Search className="h-4 w-4 shrink-0 text-[#9b9693]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search campus and roommates"
              placeholder="Find your campus people"
              className="w-full border-0 bg-transparent text-sm text-[#393634] outline-none placeholder:text-[#aaa5a1] focus:outline-none"
            />
          </form>

          <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition ${
                    active
                      ? "bg-[#fff0f2] text-[#d94468]"
                      : "text-[#77716f] hover:bg-[#f5f2f0] hover:text-[#282624]"
                  }`}
                >
                  <Icon className="h-[17px] w-[17px]" strokeWidth={active ? 2.4 : 2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <Link
                  href="/profile/edit"
                  aria-label="Edit your profile"
                  className="hidden rounded-full transition-transform hover:scale-[1.04] sm:block"
                >
                  <Photo name={user.displayName} size="sm" className="ring-2 ring-white shadow-sm" />
                </Link>
                <span className="hidden xl:block"><VerificationBadge /></span>
                <button
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  aria-label="Sign out"
                  title="Sign out"
                  className="grid h-10 w-10 place-items-center rounded-full text-[#77716f] transition hover:bg-[#f5f2f0] hover:text-[#d94468]"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden px-2 py-2 text-sm font-semibold text-[#635e5b] hover:text-[#d94468] sm:block">
                  Sign in
                </Link>
                <Link
                  href="/login?mode=register"
                  className="instagram-gradient flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white shadow-[0_7px_18px_rgba(226,67,105,0.2)] transition hover:-translate-y-0.5"
                >
                  <Sparkles className="h-4 w-4" />
                  Join GroupUp
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-[#ece8e5] bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-around">
          {[
            ...navLinks,
            { href: "/profile/edit", label: "Profile", icon: UserRound },
          ].map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition ${
                  active ? "text-[#df456a]" : "text-[#8a8582]"
                }`}
              >
                <Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2.5 : 1.9} />
                {item.label}
              </Link>
            );
          })}
          {!user && (
            <Link href="/login" className="flex min-w-[64px] flex-col items-center gap-1 px-3 py-1.5 text-[10px] font-semibold text-[#8a8582]">
              <MessageCircle className="h-5 w-5" />
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
