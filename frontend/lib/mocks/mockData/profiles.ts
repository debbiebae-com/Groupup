import type { Profile, GroupIntent, SleepSchedule } from "@/types/api";

const names = [
  "Alex", "Sam", "Riley", "Casey", "Morgan", "Taylor", "Jordan", "Avery",
  "Quinn", "Skyler", "Rowan", "Parker", "Drew", "Hayden", "Reese", "Cameron",
  "Dana", "Elliot", "Finley", "Harper", "Jules", "Kai", "Logan", "Marlow",
  "Nico", "Oakley", "Perry", "Remy", "Sasha", "Tatum",
];

const intents: GroupIntent[] = ["SOLO_NEW", "PAIR_ADD", "SOLO_JOIN"];
const schedules: SleepSchedule[] = ["EARLY_BIRD", "NIGHT_OWL", "FLEXIBLE"];
const negotiables = ["smoking", "pets", "dietary", "noise_tolerance", "guest_policy"];
const campuses = ["Main Campus", "North Campus", "East Campus", "South Campus"];

export const mockProfiles: Profile[] = Array.from({ length: 50 }, (_, i) => {
  const n = names[i % names.length];
  const clean = (i % 10) + 1;
  const energy = ((i * 3) % 10) + 1;
  const schedule = schedules[i % schedules.length];
  const tags = [negotiables[i % negotiables.length], negotiables[(i + 2) % negotiables.length]];
  const min = 300 + (i % 6) * 100;
  const max = min + 400 + (i % 3) * 200;
  return {
    id: `p_${i + 1}`,
    userId: `u_${i + 1}`,
    displayName: n,
    bio: `Continuing student looking for compatible roommates. ${schedule.toLowerCase().replace("_", " ")}.`,
    avatarUrl: null,
    cleanliness: clean,
    socialEnergy: energy,
    sleepSchedule: schedule,
    nonNegotiables: [...new Set(tags)],
    budget: { min, max, currency: "USD" },
    groupIntent: intents[i % intents.length],
    university: "National University",
    campus: campuses[i % campuses.length],
    compatibilityScore: 55 + (i % 45),
  };
});
