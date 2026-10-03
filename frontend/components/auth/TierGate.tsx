"use client";

import Link from "next/link";
import { BadgeCheck, ArrowRight, Sparkles } from "lucide-react";
import { useAuthStore } from "@/lib/store";

export function TierGate({
  requiredTier,
  children,
  fallback,
}: {
  requiredTier: 1 | 2 | 3;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const tier = useAuthStore((state) => state.tier);

  if (tier >= requiredTier) return <>{children}</>;

  return (
    fallback ?? (
      <div className="mx-auto flex min-h-[65vh] max-w-3xl items-center px-4 py-12">
        <div className="surface-card relative w-full overflow-hidden p-7 text-center sm:p-12">
          <div className="instagram-gradient absolute inset-x-0 top-0 h-2" />
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0f2] text-[#dd496b]"><BadgeCheck className="h-6 w-6" /></span>
          <p className="eyebrow mt-5">A little trust goes a long way</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.06em] text-[#2d2927]">Let&apos;s make this feel like your campus.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#817a76]">Verify your student email and finish the basics on your profile to meet people in the GroupUp community.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/auth/verify" className="instagram-gradient inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white"><Sparkles className="h-4 w-4" /> Verify my email <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/profile/edit" className="inline-flex items-center justify-center rounded-full border border-[#ece6e2] bg-white px-5 py-3 text-sm font-bold text-[#514a46] hover:bg-[#faf7f5]">Finish my profile</Link>
          </div>
        </div>
      </div>
    )
  );
}
