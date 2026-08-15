"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/types/api";
import { getProfiles } from "@/lib/api";
import { ProfileCard } from "./ProfileCard";
import { FilterPanel, type Filters } from "./FilterPanel";

const defaultFilters: Filters = { q: "", group_intent: "", budget_max: 0, campus: "" };

export function ProfileSearchClient({ initialProfiles }: { initialProfiles: Profile[] }) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProfiles({
      q: filters.q,
      group_intent: filters.group_intent || undefined,
      budget_max: filters.budget_max || undefined,
      campus: filters.campus || undefined,
    })
      .then((res) => {
        if (!cancelled) setProfiles(res.profiles);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Discover roommates</h1>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <FilterPanel filters={filters} onChange={setFilters} />
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            {loading ? "Loading..." : `${profiles.length} profiles`}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {profiles.map((p) => (
              <ProfileCard key={p.id} profile={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}