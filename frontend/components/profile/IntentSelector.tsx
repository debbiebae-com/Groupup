"use client";

import { DoorOpen, Users, UserPlus } from "lucide-react";
import type { GroupIntent } from "@/types/api";

const options: { value: GroupIntent; title: string; detail: string; icon: typeof DoorOpen }[] = [
  { value: "SOLO_NEW", title: "Start fresh", detail: "Meet people and build a group.", icon: DoorOpen },
  { value: "PAIR_ADD", title: "Grow our group", detail: "We have a start—room for more.", icon: UserPlus },
  { value: "SOLO_JOIN", title: "Find my people", detail: "Join a group that feels right.", icon: Users },
];

export function IntentSelector({ value, onChange }: { value: GroupIntent; onChange: (value: GroupIntent) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`flex min-h-[120px] flex-col items-start rounded-2xl border p-4 text-left transition ${active ? "border-[#e891a2] bg-[#fff4f5] shadow-[0_5px_17px_rgba(226,67,105,0.08)]" : "border-[#eee8e4] bg-white hover:border-[#e4d6d1] hover:bg-[#fcfaf8]"}`}
          >
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? "bg-[#f7dbe1] text-[#d94368]" : "bg-[#f3f0ee] text-[#88807b]"}`}><Icon className="h-4 w-4" /></span>
            <span className="mt-3 text-xs font-bold text-[#423b37]">{option.title}</span>
            <span className="mt-1 text-[10px] leading-4 text-[#928985]">{option.detail}</span>
          </button>
        );
      })}
    </div>
  );
}
