import Link from "next/link";
import { ArrowUpRight, BadgeCheck, BedDouble, MapPin, Moon, Sparkles, Wallet } from "lucide-react";
import type { Profile } from "@/types/api";
import { CoverPhoto } from "@/components/shared/CoverPhoto";

const intentLabels: Record<string, string> = {
  SOLO_NEW: "Looking to build a group",
  PAIR_ADD: "Has a group, needs you",
  SOLO_JOIN: "Looking to join a group",
};

const sleepLabels: Record<string, string> = {
  EARLY_BIRD: "Early bird",
  NIGHT_OWL: "Night owl",
  FLEXIBLE: "Flexible",
};

function money(value: number, currency: string) {
  const symbol = currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${value.toLocaleString()}`;
}

export function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <article className="surface-card group overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(40,31,27,0.11)]">
      <div className="relative">
        <CoverPhoto
          src={profile.avatarUrl}
          name={profile.displayName}
          alt={`Photo of ${profile.displayName}`}
          className="h-[235px] w-full sm:h-[260px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#241b1b]/70 via-transparent to-black/10" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-white/90 px-2.5 py-1.5 text-[10px] font-bold text-[#267f70] shadow-sm backdrop-blur">
            <BadgeCheck className="h-3.5 w-3.5" /> Student community
          </span>
        </div>
        {profile.compatibilityScore !== undefined && (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-[11px] font-extrabold text-[#d74367] shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> {profile.compatibilityScore}% vibe
          </span>
        )}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">{intentLabels[profile.groupIntent] ?? profile.groupIntent}</p>
          <h2 className="mt-1 text-[22px] font-extrabold leading-tight tracking-[-0.04em]">{profile.displayName}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-white/85">
            <MapPin className="h-3.5 w-3.5" /> {profile.university} · {profile.campus}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <p className="line-clamp-2 min-h-10 text-[13px] leading-5 text-[#77716f]">{profile.bio}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[#f8f6f4] px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#96908c]"><Wallet className="h-3 w-3" /> Monthly budget</p>
            <p className="mt-1 text-sm font-bold text-[#3a3532]">{money(profile.budget.min, profile.budget.currency)}–{money(profile.budget.max, profile.budget.currency)}</p>
          </div>
          <div className="rounded-2xl bg-[#f8f6f4] px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#96908c]"><Moon className="h-3 w-3" /> Their rhythm</p>
            <p className="mt-1 text-sm font-bold text-[#3a3532]">{sleepLabels[profile.sleepSchedule] ?? profile.sleepSchedule}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.nonNegotiables.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-[#eee9e5] bg-white px-2.5 py-1 text-[10px] font-medium text-[#77716f]">
              {tag.replaceAll("_", " ")}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full border border-[#eee9e5] bg-white px-2.5 py-1 text-[10px] font-medium text-[#77716f]"><BedDouble className="h-3 w-3" /> Cleanliness {profile.cleanliness}/10</span>
        </div>
        <Link href="/swipe" className="mt-4 flex items-center justify-between rounded-full bg-[#fff0f2] px-4 py-2.5 text-xs font-bold text-[#d74367] transition hover:bg-[#ffe3e9]">
          See if your rhythms match <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
