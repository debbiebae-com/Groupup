"use client";

import { Users, UserPlus, DoorOpen } from "lucide-react";
import type { GroupIntent } from "@/types/api";

const options: { value: GroupIntent; label: string; icon: typeof DoorOpen }[] = [
  { value: "SOLO_NEW", label: "Solo — form a new group", icon: DoorOpen },
  { value: "PAIR_ADD", label: "Pair — add members", icon: UserPlus },
  { value: "SOLO_JOIN", label: "Solo — join a group", icon: Users },
];

export function IntentSelector({
  value,
  onChange,
}: {
  value: GroupIntent;
  onChange: (v: GroupIntent) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {options.map((o) => {
        const Icon = o.icon;
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center text-sm transition-colors ${
              active
                ? "border-match-amber bg-match-amber/10"
                : "border-border hover:border-muted-foreground/40"
            }`}
          >
            <Icon className="h-5 w-5" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}