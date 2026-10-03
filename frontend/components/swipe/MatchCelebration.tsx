"use client";

import Link from "next/link";
import { ArrowRight, Heart, Sparkles } from "lucide-react";
import type { Profile } from "@/types/api";
import { Photo } from "@/components/shared/Photo";

export function MatchCelebration({
  profile,
  onContinue,
}: {
  profile: Profile;
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#25161c]/55 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[390px] overflow-hidden rounded-[30px] bg-white p-7 text-center shadow-[0_30px_100px_rgba(20,10,15,0.25)] sm:p-9">
        <div className="instagram-gradient absolute inset-x-0 top-0 h-2" />
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#ffdcce]/70 blur-2xl" />
        <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0f2] text-[#df496b]"><Sparkles className="h-6 w-6" /></span>
        <h2 className="relative mt-4 text-3xl font-black tracking-[-0.06em] text-[#302b29]">It&apos;s a match!</h2>
        <p className="relative mt-2 text-sm leading-6 text-[#827b77]">Good energy going both ways. You and {profile.displayName} could make a lovely home team.</p>
        <div className="relative mx-auto mt-6 flex w-fit items-center gap-3 rounded-full bg-[#faf7f5] p-2 pr-4">
          <Photo name="Jordan Lee" size="lg" className="ring-2 ring-white" />
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#e34e70] shadow-sm"><Heart className="h-4 w-4 fill-current" /></span>
          <Photo src={profile.avatarUrl} name={profile.displayName} size="lg" className="ring-2 ring-white" />
        </div>
        <div className="relative mt-6 grid gap-2">
          <Link href="/groups" onClick={onContinue} className="instagram-gradient flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-[0_8px_22px_rgba(226,67,105,0.22)]">
            Find your circle <ArrowRight className="h-4 w-4" />
          </Link>
          <button onClick={onContinue} className="rounded-full px-5 py-3 text-sm font-semibold text-[#817a76] transition hover:bg-[#f7f4f2]">Keep discovering</button>
        </div>
      </div>
    </div>
  );
}
