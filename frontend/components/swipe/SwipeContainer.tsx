"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Compass, Heart, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/types/api";
import { getProfiles, sendSwipe } from "@/lib/api";
import { SwipeCard } from "./SwipeCard";
import { SwipeButtons } from "./SwipeButtons";
import { MatchCelebration } from "./MatchCelebration";

const EMPTY_PROFILES: Profile[] = [];

export function SwipeContainer({ initialProfiles = EMPTY_PROFILES }: { initialProfiles?: Profile[] }) {
  const [queue, setQueue] = useState<Profile[]>(initialProfiles);
  const [matched, setMatched] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(initialProfiles.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProfiles.length > 0) return;
    let cancelled = false;
    getProfiles()
      .then((response) => { if (!cancelled) setQueue(response.profiles); })
      .catch((requestError) => { if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Couldn't load profiles."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [initialProfiles]);

  const current = queue[0];

  async function swipe(action: "LIKE" | "PASS") {
    if (!current) return;
    const selected = current;
    setQueue((profiles) => profiles.slice(1));
    setError(null);
    try {
      const response = await sendSwipe({ targetProfileId: selected.id, action });
      if (action === "LIKE" && response.isMatch) setMatched(selected);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Your choice could not be saved.");
    }
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const response = await getProfiles();
      setQueue(response.profiles);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Couldn't refresh profiles.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid items-center gap-9 lg:grid-cols-[minmax(280px,0.75fr)_minmax(410px,1fr)] lg:gap-16">
        <div className="order-2 max-w-[440px] lg:order-1">
          <p className="eyebrow flex items-center gap-2"><Heart className="h-3.5 w-3.5" /> The roommate vibe check</p>
          <h1 className="mt-3 text-4xl font-black leading-[1.02] tracking-[-0.07em] text-[#2b2826] sm:text-5xl">A little spark. <span className="text-gradient">A lot of home.</span></h1>
          <p className="mt-4 text-sm leading-6 text-[#817a76] sm:text-base sm:leading-7">Take a look around, notice the everyday details, and save a hello for the people who feel like your kind of crew.</p>

          <div className="mt-7 space-y-3">
            <div className="flex items-start gap-3 rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff0f2] text-[#db456a]"><Sparkles className="h-4 w-4" /></span>
              <div><p className="text-xs font-bold text-[#3c3633]">Compatibility, not just proximity</p><p className="mt-1 text-[11px] leading-4 text-[#89827e]">Compare habits, budget and what makes a shared space work.</p></div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f1eaff] text-[#8a55c1]"><Compass className="h-4 w-4" /></span>
              <div><p className="text-xs font-bold text-[#3c3633]">Keep it mutual</p><p className="mt-1 text-[11px] leading-4 text-[#89827e]">A match only happens when you both want to connect.</p></div>
            </div>
          </div>

          <Link href="/profiles" className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#d94368] hover:text-[#b83556]">Browse everyone <ArrowRight className="h-4 w-4" /></Link>
        </div>

        <div className="order-1 flex flex-col items-center lg:order-2">
          {loading && !current ? (
            <div className="h-[520px] w-full max-w-[410px] animate-pulse rounded-[30px] bg-white shadow-sm" />
          ) : current ? (
            <>
              <div className="mb-4 flex w-full max-w-[410px] items-center justify-between px-1">
                <p className="text-xs font-bold text-[#655e5a]">Someone you might click with <span className="ml-1 font-medium text-[#aaa29e]">· {queue.length} left</span></p>
                <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-[#958d88] shadow-sm">Drag to decide</span>
              </div>
              <SwipeCard key={current.id} profile={current} onSwipe={swipe} />
              <div className="mt-5"><SwipeButtons onLike={() => void swipe("LIKE")} onPass={() => void swipe("PASS")} /></div>
              <p className="mt-3 text-[10px] text-[#a39c98]">Be kind. Your choice is private unless it becomes a match.</p>
            </>
          ) : (
            <div className="surface-card flex min-h-[420px] w-full max-w-[410px] flex-col items-center justify-center p-8 text-center">
              <div className="instagram-gradient grid h-14 w-14 place-items-center rounded-2xl text-white"><Heart className="h-6 w-6" /></div>
              <h2 className="mt-4 text-xl font-extrabold text-[#332f2c]">You&apos;re all caught up</h2>
              <p className="mt-2 text-sm leading-6 text-[#847d79]">Take a breath, then see who else is around your campus.</p>
              {error && <p role="alert" className="mt-3 text-xs text-[#b8424e]">{error}</p>}
              <button onClick={() => void refresh()} className="mt-5 rounded-full bg-[#fff0f2] px-5 py-2.5 text-xs font-bold text-[#d94368]">Refresh people</button>
            </div>
          )}
          {error && current && <p role="alert" className="mt-3 max-w-[410px] text-center text-xs text-[#b8424e]">{error}</p>}
        </div>
      </div>
      {matched && <MatchCelebration profile={matched} onContinue={() => setMatched(null)} />}
    </div>
  );
}
