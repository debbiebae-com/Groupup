"use client";

import { useEffect, useState } from "react";
import { Compass, Heart, Sparkles } from "lucide-react";
import type { Profile } from "@/types/api";
import { getProfiles } from "@/lib/api";
import { ProfileCard } from "./ProfileCard";
import { FilterPanel, type Filters } from "./FilterPanel";
import { Photo } from "@/components/shared/Photo";
import Link from "next/link";

const defaultFilters: Filters = { q: "", group_intent: "", budget_max: 0, campus: "" };

export function ProfileSearchClient({ initialProfiles = [] }: { initialProfiles?: Profile[] }) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [loading, setLoading] = useState(initialProfiles.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("q");
    if (query) setFilters((current) => ({ ...current, q: query }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProfiles({
      q: filters.q,
      group_intent: filters.group_intent || undefined,
      budget_max: filters.budget_max || undefined,
      campus: filters.campus || undefined,
    })
      .then((response) => {
        if (!cancelled) setProfiles(response.profiles);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "We couldn't load profiles right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [filters]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-11">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow flex items-center gap-2"><Compass className="h-3.5 w-3.5" /> Your campus, your kind of people</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.065em] text-[#2e2a28] sm:text-5xl">Find your <span className="text-gradient">roommate rhythm.</span></h1>
          <p className="mt-3 max-w-[620px] text-sm leading-6 text-[#817a76] sm:text-base">A good home starts with the way you live. Browse students nearby and look for the details that click.</p>
        </div>
        <Link href="/swipe" className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-white px-4 py-2.5 text-xs font-bold text-[#d94368] shadow-sm ring-1 ring-[#eee5e2] transition hover:bg-[#fff4f5] sm:self-auto">
          <Heart className="h-4 w-4" /> Try the vibe check
        </Link>
      </div>

      <section aria-label="Campus stories" className="mt-7 flex gap-4 overflow-x-auto rounded-3xl border border-white/80 bg-white/70 px-4 py-4 shadow-sm sm:gap-6 sm:px-6">
        <button onClick={() => setFilters((current) => ({ ...current, q: "" }))} className="flex w-[72px] shrink-0 flex-col items-center gap-2 text-center">
          <span className="instagram-gradient grid h-[60px] w-[60px] place-items-center rounded-full p-[3px] shadow-sm"><span className="grid h-full w-full place-items-center rounded-full bg-white text-[#e34b6c]"><Sparkles className="h-5 w-5" /></span></span>
          <span className="text-[10px] font-semibold text-[#615b58]">For you</span>
        </button>
        {profiles.slice(0, 6).map((profile) => (
          <button
            key={profile.id}
            onClick={() => setFilters((current) => ({ ...current, q: profile.displayName }))}
            className="flex w-[72px] shrink-0 flex-col items-center gap-2 text-center"
            aria-label={`See ${profile.displayName}`}
          >
            <span className="instagram-gradient rounded-full p-[2px] shadow-sm"><Photo src={profile.avatarUrl} name={profile.displayName} size="story" className="border-[2px] border-white" /></span>
            <span className="max-w-[72px] truncate text-[10px] font-semibold text-[#615b58]">{profile.displayName.split(" ")[0]}</span>
          </button>
        ))}
        <div className="ml-auto hidden min-w-[185px] items-center gap-3 border-l border-[#eee9e5] pl-5 lg:flex">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fff3df] text-[#be7d2e]"><Sparkles className="h-4 w-4" /></div>
          <div><p className="text-xs font-bold text-[#433d39]">Thoughtful matches</p><p className="mt-1 text-[10px] text-[#908985]">Habits matter as much as rent.</p></div>
        </div>
      </section>

      <div className="mt-7 grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-7">
        <FilterPanel filters={filters} onChange={setFilters} />
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><h2 className="text-base font-extrabold tracking-[-0.03em] text-[#383330]">Roommates to meet</h2><p className="mt-1 text-xs text-[#8b8581]">{loading ? "Finding people who fit…" : `${profiles.length} people to discover`}</p></div>
            <span className="hidden items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[10px] font-semibold text-[#817a76] shadow-sm sm:flex"><Sparkles className="h-3.5 w-3.5 text-[#e96573]" /> A little more human</span>
          </div>

          {error && <div role="alert" className="mb-4 rounded-2xl border border-[#f5c8c8] bg-[#fff4f3] p-4 text-sm text-[#a43f49]">{error}</div>}
          {loading && profiles.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((item) => <div key={item} className="h-[470px] animate-pulse rounded-3xl bg-white/80" />)}
            </div>
          ) : profiles.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {profiles.map((profile) => <ProfileCard key={profile.id} profile={profile} />)}
            </div>
          ) : (
            <div className="surface-card flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0f2] text-[#dd4c6c]"><Compass className="h-6 w-6" /></div>
              <h3 className="mt-4 text-lg font-bold text-[#37322f]">No one quite like that yet</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#847d79]">Try widening your filters. There are more campus stories waiting to be found.</p>
              <button onClick={() => setFilters(defaultFilters)} className="mt-5 rounded-full bg-[#fff0f2] px-4 py-2.5 text-xs font-bold text-[#d94368]">Clear filters</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
