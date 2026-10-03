"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/types/api";
import { getProfiles, sendSwipe } from "@/lib/api";
import { SwipeCard } from "./SwipeCard";
import { SwipeButtons } from "./SwipeButtons";
import { MatchCelebration } from "./MatchCelebration";

export function SwipeContainer({ initialProfiles = [] }: { initialProfiles?: Profile[] }) {
  const [queue, setQueue] = useState<Profile[]>(initialProfiles);
  const [matched, setMatched] = useState<Profile | null>(null);

  useEffect(() => {
    if (queue.length === 0) {
      getProfiles().then((res) => setQueue(res.profiles));
    }
  }, [queue.length]);

  const current = queue[0];

  async function swipe(action: "LIKE" | "PASS") {
    if (!current) return;
    const next = queue.slice(1);
    setQueue(next);
    if (action === "LIKE") {
      const res = await sendSwipe({ targetProfileId: current.id, action });
      if (res.isMatch) {
        setMatched(current);
      }
    }
  }

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium">No more profiles</p>
        <p className="text-sm text-muted-foreground">Check back soon for new roommates.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <SwipeCard key={current.id} profile={current} onSwipe={swipe} />
      <SwipeButtons onLike={() => swipe("LIKE")} onPass={() => swipe("PASS")} />
      {matched && (
        <MatchCelebration profile={matched} onContinue={() => setMatched(null)} />
      )}
    </div>
  );
}