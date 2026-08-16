"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import type { Profile } from "@/types/api";

const intentLabels: Record<string, string> = {
  SOLO_NEW: "Forming a group",
  PAIR_ADD: "Adding members",
  SOLO_JOIN: "Joining a group",
};

export function SwipeCard({
  profile,
  onSwipe,
}: {
  profile: Profile;
  onSwipe: (direction: "LIKE" | "PASS") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-12, 12]);
  const likeOpacity = useTransform(x, [40, 180], [0, 1]);
  const passOpacity = useTransform(x, [-180, -40], [1, 0]);

  function handleDragEnd() {
    const offset = x.get();
    if (offset > 120) onSwipe("LIKE");
    else if (offset < -120) onSwipe("PASS");
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      style={{ x, rotate }}
      onDragEnd={handleDragEnd}
      className="relative h-[480px] w-full max-w-sm cursor-grab rounded-2xl border bg-card p-6 shadow-sm active:cursor-grabbing"
    >
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute left-4 top-4 rounded-md border-2 border-swipe-accept px-3 py-1 text-lg font-bold text-swipe-accept"
      >
        LIKE
      </motion.div>
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute right-4 top-4 rounded-md border-2 border-swipe-reject px-3 py-1 text-lg font-bold text-swipe-reject"
      >
        PASS
      </motion.div>

      <div className="flex flex-col items-center pt-10 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted text-3xl font-medium">
          {profile.displayName.slice(0, 1)}
        </div>
        <h2 className="mt-4 text-xl font-semibold">{profile.displayName}</h2>
        <p className="text-sm text-muted-foreground">
          {profile.university} · {profile.campus}
        </p>
        {profile.compatibilityScore !== undefined && (
          <span className="mt-2 rounded-full bg-verified-teal/10 px-3 py-1 text-sm font-medium text-verified-teal">
            {profile.compatibilityScore}% match
          </span>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Cleanliness</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-match-amber" style={{ width: `${profile.cleanliness * 10}%` }} />
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Social energy</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-match-amber" style={{ width: `${profile.socialEnergy * 10}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
        {profile.nonNegotiables.map((tag) => (
          <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {tag.replace("_", " ")}
          </span>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {intentLabels[profile.groupIntent]} · {profile.sleepSchedule.toLowerCase().replace("_", " ")}
      </p>
    </motion.div>
  );
}