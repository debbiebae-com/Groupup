"use client";

import type { Group } from "@/types/api";

export function GroupCard({
  group,
  onOpen,
}: {
  group: Group;
  onOpen: () => void;
}) {
  const memberCount = group.members.length;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">{group.name}</p>
          <p className="text-xs text-muted-foreground">
            {group.intent.replace("_", " ").toLowerCase()} · created{" "}
            {new Date(group.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex -space-x-2">
          {group.members.slice(0, 4).map((m) => (
            <div
              key={m.userId}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium"
            >
              {m.userId.replace("u_", "").slice(0, 1).toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {memberCount} member{memberCount === 1 ? "" : "s"}
      </p>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onOpen}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          Open group
        </button>
      </div>
    </div>
  );
}