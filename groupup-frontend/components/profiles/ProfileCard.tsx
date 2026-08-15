import type { Profile } from "@/types/api";

const intentLabels: Record<string, string> = {
  SOLO_NEW: "Forming a group",
  PAIR_ADD: "Adding members",
  SOLO_JOIN: "Joining a group",
};

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{value}/10</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-match-amber" style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  );
}

export function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-medium">
            {profile.displayName.slice(0, 1)}
          </div>
          <div>
            <p className="font-medium">{profile.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {profile.university} · {profile.campus}
            </p>
          </div>
        </div>
        {profile.compatibilityScore !== undefined && (
          <span className="rounded-full bg-verified-teal/10 px-2 py-0.5 text-xs font-medium text-verified-teal">
            {profile.compatibilityScore}% match
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-verified-teal px-2 py-0.5 text-xs font-medium text-white">
          Verified Student
        </span>
        <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
          {intentLabels[profile.groupIntent] ?? profile.groupIntent}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <Meter label="Cleanliness" value={profile.cleanliness} />
        <Meter label="Social energy" value={profile.socialEnergy} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {profile.nonNegotiables.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
          >
            {tag.replace("_", " ")}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Sleep: {profile.sleepSchedule.toLowerCase().replace("_", " ")} · Budget ${profile.budget.min}–${profile.budget.max}
      </p>
    </div>
  );
}