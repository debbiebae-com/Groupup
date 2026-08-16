"use client";

import { useState } from "react";
import type { Match } from "@/types/api";
import { createGroup } from "@/lib/api";

export function CreateGroupModal({
  matches,
  onCreated,
  onClose,
}: {
  matches: Match[];
  onCreated: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("New Group");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function submit() {
    setError(null);
    if (selected.length < 1) {
      setError("Select at least one member.");
      return;
    }
    setLoading(true);
    try {
      await createGroup({ name, memberUserIds: selected });
      onCreated(name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Form a group</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />

        <p className="mt-4 text-sm font-medium">Select mutual matches</p>
        <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No matches yet — swipe to find roommates first.
            </p>
          ) : (
            matches.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(m.matchedUserId)}
                  onChange={() => toggle(m.matchedUserId)}
                />
                {m.profile.displayName} · {m.profile.groupIntent.replace("_", " ").toLowerCase()}
              </label>
            ))
          )}
        </div>

        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create group"}
          </button>
        </div>
      </div>
    </div>
  );
}