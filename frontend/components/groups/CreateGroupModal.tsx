"use client";

import { useState } from "react";
import { Check, Sparkles, UsersRound, X } from "lucide-react";
import type { Match } from "@/types/api";
import { createGroup } from "@/lib/api";
import { Photo } from "@/components/shared/Photo";

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
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function submit() {
    setError(null);
    if (selected.length < 1) {
      setError("Choose at least one mutual match to start your circle.");
      return;
    }
    setLoading(true);
    try {
      await createGroup({ name: name.trim() || "Our group", memberUserIds: selected });
      onCreated(name);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Your group couldn't be created.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#23171c]/55 p-4 backdrop-blur-sm">
      <div className="my-auto w-full max-w-[480px] overflow-hidden rounded-[28px] bg-white shadow-[0_30px_100px_rgba(15,10,12,0.28)]">
        <div className="instagram-gradient relative px-6 pb-7 pt-6 text-white sm:px-8">
          <button onClick={onClose} aria-label="Close" className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"><X className="h-4 w-4" /></button>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20"><UsersRound className="h-5 w-5" /></span>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">Good things grow together</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.05em]">Start your circle.</h2>
          <p className="mt-2 max-w-sm text-xs leading-5 text-white/85">Bring your mutual matches into one space and start imagining the home you could make.</p>
        </div>

        <div className="p-6 sm:p-8">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#514a46]">Give this circle a name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-[#eee8e4] bg-[#fcfbfa] px-4 py-3 text-sm outline-none focus:border-[#e790a2]" placeholder="e.g. The Sunday Reset" />
          </label>
          <div className="mt-5 flex items-center justify-between"><p className="text-xs font-bold text-[#514a46]">Invite your mutuals</p><span className="rounded-full bg-[#f7f3ff] px-2.5 py-1 text-[10px] font-bold text-[#8b58c0]">{selected.length} selected</span></div>
          <div className="mt-2 max-h-[230px] space-y-2 overflow-y-auto pr-1">
            {matches.length === 0 ? (
              <div className="rounded-2xl bg-[#faf8f6] p-4 text-xs leading-5 text-[#89827e]">No mutual matches yet. A quick vibe check might introduce you to someone new.</div>
            ) : matches.map((match) => {
              const checked = selected.includes(match.matchedUserId);
              return (
                <button key={match.id} type="button" onClick={() => toggle(match.matchedUserId)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${checked ? "border-[#e79aaa] bg-[#fff5f6]" : "border-[#f0ece9] bg-white hover:bg-[#fcfaf8]"}`}>
                  <Photo src={match.profile.avatarUrl} name={match.profile.displayName} size="md" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-[#433d39]">{match.profile.displayName}</span><span className="mt-1 block truncate text-[10px] text-[#918985]">{match.profile.campus} · {match.profile.groupIntent.replaceAll("_", " ").toLowerCase()}</span></span>
                  <span className={`grid h-6 w-6 place-items-center rounded-full border ${checked ? "border-[#df496c] bg-[#df496c] text-white" : "border-[#e4ddda] bg-white text-transparent"}`}><Check className="h-3.5 w-3.5" /></span>
                </button>
              );
            })}
          </div>
          {error && <p role="alert" className="mt-3 text-xs font-medium text-[#b8424e]">{error}</p>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
            <button onClick={onClose} className="flex-1 rounded-full border border-[#eee8e4] px-4 py-3 text-xs font-bold text-[#655e5a] hover:bg-[#faf7f5]">Maybe later</button>
            <button onClick={() => void submit()} disabled={loading} className="instagram-gradient flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-bold text-white shadow-[0_8px_20px_rgba(226,67,105,0.18)] disabled:opacity-60"><Sparkles className="h-4 w-4" /> {loading ? "Gathering your circle…" : "Create group"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
