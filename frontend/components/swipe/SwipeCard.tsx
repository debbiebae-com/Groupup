"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { BadgeCheck, MapPin, Moon, Sparkles } from "lucide-react";
import type { Profile } from "@/types/api";
import { CoverPhoto } from "@/components/shared/CoverPhoto";

const intentLabels: Record<string, string> = {
  SOLO_NEW: "Building a group",
  PAIR_ADD: "Adding to a group",
  SOLO_JOIN: "Finding a group",
};

export function SwipeCard({
  profile,
  onSwipe,
}: {
  profile: Profile;
  onSwipe: (direction: "LIKE" | "PASS") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-9, 9]);
  const likeOpacity = useTransform(x, [25, 150], [0, 1]);
  const passOpacity = useTransform(x, [-150, -25], [1, 0]);

  function handleDragEnd() {
    const offset = x.get();
    if (offset > 120) onSwipe("LIKE");
    else if (offset < -120) onSwipe("PASS");
  }

  return (
    <motion.article
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.82}
      style={{ x, rotate }}
      onDragEnd={handleDragEnd}
      className="group relative h-[520px] w-full max-w-[410px] cursor-grab overflow-hidden rounded-[30px] bg-[#ded3ce] shadow-[0_24px_65px_rgba(58,42,38,0.18)] active:cursor-grabbing sm:h-[560px]"
    >
      <CoverPhoto src={profile.avatarUrl} name={profile.displayName} alt={`Photo of ${profile.displayName}`} className="absolute inset-0 h-full w-full" priority />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#170f11]/90" />

      <motion.span style={{ opacity: likeOpacity }} className="absolute left-6 top-6 z-10 rotate-[-9deg] rounded-xl border-[3px] border-[#65e0a4] bg-black/10 px-4 py-2 text-xl font-black tracking-[0.12em] text-[#8bf1bb] backdrop-blur-sm">LIKE</motion.span>
      <motion.span style={{ opacity: passOpacity }} className="absolute right-6 top-6 z-10 rotate-[9deg] rounded-xl border-[3px] border-[#ff8390] bg-black/10 px-4 py-2 text-xl font-black tracking-[0.12em] text-[#ff9ca5] backdrop-blur-sm">PASS</motion.span>

      <div className="absolute left-5 right-5 top-5 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/25 px-3 py-2 text-[10px] font-bold text-white backdrop-blur-md"><BadgeCheck className="h-3.5 w-3.5 text-[#83e1c6]" /> Campus verified</span>
        {profile.compatibilityScore !== undefined && <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-2 text-[10px] font-extrabold text-[#d94368] shadow-sm"><Sparkles className="h-3.5 w-3.5" /> {profile.compatibilityScore}% vibe</span>}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-white/75">{intentLabels[profile.groupIntent] ?? profile.groupIntent}</p>
        <h2 className="mt-1 text-xl font-extrabold tracking-[-0.04em] sm:text-[32px]">{profile.displayName}</h2>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-white/80"><MapPin className="h-3.5 w-3.5" /> {profile.university} · {profile.campus}</p>
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/90">{profile.bio}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur"><Moon className="h-3 w-3" /> {profile.sleepSchedule.toLowerCase().replace("_", " ")}</span>
          <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur">${profile.budget.min}–${profile.budget.max} / month</span>
          {profile.nonNegotiables.slice(0, 1).map((tag) => <span key={tag} className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur">{tag.replaceAll("_", " ")}</span>)}
        </div>
      </div>
    </motion.article>
  );
}
