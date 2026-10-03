"use client";

import { ArrowUpRight, CalendarDays, MessageCircle, UsersRound } from "lucide-react";
import type { Group } from "@/types/api";
import { Photo } from "@/components/shared/Photo";
import { mockProfiles } from "@/lib/mocks/mockData/profiles";

const covers = [
  "/images/demo/spaces/living-room-01.jpg",
  "/images/demo/spaces/living-room-02.jpg",
  "/images/demo/spaces/living-room-03.jpg",
  "/images/demo/spaces/living-room-04.jpg",
];

export function GroupCard({ group, onOpen }: { group: Group; onOpen: () => void }) {
  const memberCount = group.members.length;
  const cover = covers[Math.abs(group.name.length) % covers.length];

  return (
    <article className="surface-card group overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(40,31,27,0.11)]">
      <div className="relative h-[170px] overflow-hidden bg-[#eee3dc]">
        <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.04]" style={{ backgroundImage: `linear-gradient(0deg, rgba(28,21,22,.56), transparent 70%), url("${cover}")` }} />
        <div className="absolute left-4 top-4 rounded-full border border-white/40 bg-white/90 px-3 py-1.5 text-[10px] font-bold text-[#5b514c] shadow-sm">{group.intent.replaceAll("_", " ").toLowerCase()}</div>
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/75">The group chat</p><h3 className="mt-1 text-xl font-extrabold tracking-[-0.04em]">{group.name}</h3></div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/30 bg-white/15 backdrop-blur"><ArrowUpRight className="h-4 w-4" /></span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex -space-x-2.5">
            {group.members.slice(0, 4).map((member) => {
              const profile = mockProfiles.find((candidate) => candidate.userId === member.userId);
              const displayName = member.userId === "u_me" ? "Jordan Lee" : profile?.displayName ?? "Group member";
              return <Photo key={member.userId} src={member.userId === "u_me" ? "/images/demo/people/portrait-13.jpg" : profile?.avatarUrl} name={displayName} size="sm" className="border-[2px] border-white shadow-sm" />;
            })}
            {memberCount > 4 && <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-[#f1eaff] text-[10px] font-bold text-[#8b58c0]">+{memberCount - 4}</span>}
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#938c88]"><CalendarDays className="h-3.5 w-3.5" /> {new Date(group.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-[#f0ece9] pt-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[#716a66]"><UsersRound className="h-3.5 w-3.5 text-[#a16aba]" /> {memberCount} in your circle</p>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-[#918984]"><MessageCircle className="h-3.5 w-3.5" /> Open chat</p>
        </div>
        <button onClick={onOpen} className="mt-4 w-full rounded-full bg-[#fff0f2] px-4 py-2.5 text-xs font-bold text-[#d94368] transition hover:bg-[#ffe3e9]">Open group</button>
      </div>
    </article>
  );
}
