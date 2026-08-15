"use client";

import type { Profile } from "@/types/api";

export function MatchCelebration({
  profile,
  onContinue,
}: {
  profile: Profile;
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-match-amber text-3xl">
          🎉
        </div>
        <h2 className="mt-4 text-2xl font-semibold">It&apos;s a match!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You and <span className="font-medium text-foreground">{profile.displayName}</span> liked each other.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Group intent: {profile.groupIntent.replace("_", " ").toLowerCase()}
        </p>
        <div className="mt-6 space-y-2">
          <button
            onClick={onContinue}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Continue swiping
          </button>
        </div>
      </div>
    </div>
  );
}