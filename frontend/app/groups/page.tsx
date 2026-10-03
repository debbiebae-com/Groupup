"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, MessageCircle, Plus, Sparkles, UsersRound } from "lucide-react";
import type { Group, Match } from "@/types/api";
import { getMyGroups, getMatches } from "@/lib/api";
import { GroupCard } from "@/components/groups/GroupCard";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { GroupAgreementTemplate } from "@/components/groups/GroupAgreementTemplate";
import { GroupChat } from "@/components/groups/GroupChat";
import { VideoCallContainer } from "@/components/video/VideoCallContainer";
import { Photo } from "@/components/shared/Photo";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [showAgreement, setShowAgreement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMyGroups(), getMatches()])
      .then(([groupResponse, matchResponse]) => {
        if (!cancelled) {
          setGroups(groupResponse.groups);
          setMatches(matchResponse.matches);
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Your groups couldn't load.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function refresh() {
    const response = await getMyGroups();
    setGroups(response.groups);
  }

  return (
    <div className="mx-auto max-w-[1220px] px-4 py-8 sm:px-6 sm:py-11">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow flex items-center gap-2"><UsersRound className="h-3.5 w-3.5" /> Good people, good group chats</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.065em] text-[#2e2a28] sm:text-5xl">Your circle, <span className="text-gradient">taking shape.</span></h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#817a76] sm:text-base">A place for the little plans, the big questions and everything that turns a few matches into a home team.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowAgreement(true)} className="inline-flex items-center gap-2 rounded-full border border-[#e9e3df] bg-white px-4 py-2.5 text-xs font-bold text-[#5e5753] shadow-sm transition hover:bg-[#faf7f5]"><BookOpenCheck className="h-4 w-4 text-[#a16aba]" /> Agreement guide</button>
          <button onClick={() => setShowCreate(true)} className="instagram-gradient inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_18px_rgba(226,67,105,0.2)] transition hover:-translate-y-0.5"><Plus className="h-4 w-4" /> Form a group</button>
        </div>
      </div>

      {error && <p role="alert" className="mt-6 rounded-2xl border border-[#f3cccc] bg-[#fff4f3] p-4 text-sm text-[#a7444d]">{error}</p>}

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div><h2 className="text-base font-extrabold text-[#393431]">Your groups</h2><p className="mt-1 text-xs text-[#8d8682]">{loading ? "Gathering your people…" : `${groups.length} group${groups.length === 1 ? "" : "s"} in your circle`}</p></div>
            <span className="hidden rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-[#8b8480] shadow-sm sm:block">A good thing, in progress</span>
          </div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2"><div className="h-72 animate-pulse rounded-3xl bg-white" /><div className="h-72 animate-pulse rounded-3xl bg-white" /></div>
          ) : groups.length ? (
            <div className="grid gap-4 sm:grid-cols-2"><GroupCard group={groups[0]} onOpen={() => setActiveGroup(groups[0])} />{groups.slice(1).map((group) => <GroupCard key={group.id} group={group} onOpen={() => setActiveGroup(group)} />)}</div>
          ) : (
            <div className="surface-card flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f2eaff] text-[#8d58c3]"><UsersRound className="h-6 w-6" /></span>
              <h3 className="mt-4 text-lg font-bold text-[#36312e]">Your circle starts with a match.</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#827b77]">Meet people who share your roommate rhythm, then bring your mutual matches together here.</p>
              <Link href="/swipe" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#fff0f2] px-4 py-2.5 text-xs font-bold text-[#d94368]">Find your people <ArrowRight className="h-4 w-4" /></Link>
            </div>
          )}
        </section>

        <aside className="surface-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div><p className="eyebrow">The good beginnings</p><h2 className="mt-1 text-lg font-extrabold tracking-[-0.04em] text-[#36312e]">Your mutuals</h2></div>
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fff0f2] text-[#d94368]"><MessageCircle className="h-4 w-4" /></span>
          </div>
          <p className="mt-2 text-xs leading-5 text-[#8b8480]">People who are already a two-way yes.</p>
          <div className="mt-5 space-y-3">
            {matches.slice(0, 4).map((match) => (
              <div key={match.id} className="flex items-center gap-3 rounded-2xl bg-[#faf8f6] p-2.5">
                <Photo src={match.profile.avatarUrl} name={match.profile.displayName} size="md" />
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#433d39]">{match.profile.displayName}</p><p className="mt-0.5 truncate text-[10px] text-[#918985]">{match.profile.campus}</p></div>
                <span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-[#d54a6a]">Matched</span>
              </div>
            ))}
            {!loading && matches.length === 0 && <p className="rounded-2xl bg-[#faf8f6] p-4 text-xs leading-5 text-[#8b8480]">Your next mutual match will show up here.</p>}
          </div>
          <Link href="/swipe" className="mt-4 flex items-center justify-center gap-2 rounded-full border border-[#eee7e3] bg-white px-4 py-2.5 text-xs font-bold text-[#6b625d] transition hover:bg-[#fff5f6] hover:text-[#d94368]">Meet more people <ArrowRight className="h-3.5 w-3.5" /></Link>
          <div className="mt-5 rounded-2xl bg-gradient-to-br from-[#fff4ea] to-[#fff0f4] p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-[#6b4e4b]"><Sparkles className="h-3.5 w-3.5 text-[#d96e70]" /> A gentle reminder</p>
            <p className="mt-2 text-[11px] leading-5 text-[#87706d]">Talk about budgets, guests and quiet hours before you tour a place together.</p>
          </div>
        </aside>
      </div>

      {activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#23171c]/55 p-3 backdrop-blur-sm sm:p-6">
          <div className="my-auto w-full max-w-[980px] overflow-hidden rounded-[28px] bg-[#fbfaf9] shadow-[0_28px_100px_rgba(15,10,12,0.3)]">
            <div className="flex items-center justify-between border-b border-[#eee8e4] bg-white px-5 py-4 sm:px-7">
              <div><p className="eyebrow">Your shared space</p><h2 className="mt-1 text-xl font-extrabold tracking-[-0.04em] text-[#332e2b]">{activeGroup.name}</h2></div>
              <button onClick={() => setActiveGroup(null)} aria-label="Close group" className="grid h-10 w-10 place-items-center rounded-full bg-[#f4f1ef] text-[#6c6561] transition hover:bg-[#fff0f2] hover:text-[#d94368]">×</button>
            </div>
            <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-4">
                <div className="rounded-3xl bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-[#514a46]">Say hello face-to-face</p><span className="rounded-full bg-[#f2eaff] px-2.5 py-1 text-[9px] font-bold text-[#8b58c0]">Optional</span></div><VideoCallContainer groupId={activeGroup.id} groupName={activeGroup.name} /></div>
                <div className="rounded-3xl bg-gradient-to-br from-[#fff0f2] to-[#f6eeff] p-5"><p className="text-xs font-bold text-[#51414a]">A good group is a conversation.</p><p className="mt-2 text-xs leading-5 text-[#85727d]">Use this space to share plans, talk through expectations and get to know each other.</p></div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-5"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-[#514a46]">Group conversation</p><span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#299378]"><span className="h-1.5 w-1.5 rounded-full bg-[#44bd91]" /> Just your circle</span></div><GroupChat groupId={activeGroup.id} /></div>
            </div>
          </div>
        </div>
      )}

      {showCreate && <CreateGroupModal matches={matches} onCreated={async () => { setShowCreate(false); await refresh(); }} onClose={() => setShowCreate(false)} />}
      {showAgreement && <GroupAgreementTemplate onClose={() => setShowAgreement(false)} />}
    </div>
  );
}
