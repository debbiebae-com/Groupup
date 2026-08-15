"use client";

import { useEffect, useState } from "react";
import type { Group, Match } from "@/types/api";
import { getMyGroups, getMatches } from "@/lib/api";
import { GroupCard } from "@/components/groups/GroupCard";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { GroupAgreementTemplate } from "@/components/groups/GroupAgreementTemplate";
import { GroupChat } from "@/components/groups/GroupChat";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [showAgreement, setShowAgreement] = useState(false);

  useEffect(() => {
    getMyGroups().then((res) => setGroups(res.groups));
    getMatches().then((res) => setMatches(res.matches));
  }, []);

  async function refresh() {
    const res = await getMyGroups();
    setGroups(res.groups);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your groups</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAgreement(true)}
            className="rounded-md border px-3 py-1.5 text-sm"
          >
            Agreement template
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            Form group
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {groups.map((g) => (
          <GroupCard key={g.id} group={g} onOpen={() => setActiveGroup(g)} />
        ))}
      </div>

      {activeGroup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{activeGroup.name}</h2>
              <button onClick={() => setActiveGroup(null)} className="text-sm text-muted-foreground">
                Close
              </button>
            </div>
            <div className="mt-4">
              <GroupChat groupId={activeGroup.id} />
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateGroupModal
          matches={matches}
          onCreated={async () => {
            setShowCreate(false);
            await refresh();
          }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {showAgreement && (
        <GroupAgreementTemplate onClose={() => setShowAgreement(false)} />
      )}
    </div>
  );
}