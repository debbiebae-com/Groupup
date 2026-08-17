import { z } from "zod";

export const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(60),
  bio: z.string().max(300).default(""),
  cleanliness: z.number().int().min(1).max(10),
  socialEnergy: z.number().int().min(1).max(10),
  sleepSchedule: z.enum(["EARLY_BIRD", "NIGHT_OWL", "FLEXIBLE"]),
  nonNegotiables: z.array(z.string()).default([]),
  budget: z.object({
    min: z.number().int().min(0),
    max: z.number().int().min(0),
    currency: z.string().default("USD"),
  }),
  groupIntent: z.enum(["SOLO_NEW", "PAIR_ADD", "SOLO_JOIN"]),
  university: z.string().min(1),
  campus: z.string().min(1),
});

export const profileFiltersSchema = z.object({
  q: z.string().optional(),
  group_intent: z.enum(["SOLO_NEW", "PAIR_ADD", "SOLO_JOIN"]).optional(),
  budget_max: z.coerce.number().int().positive().optional(),
  campus: z.string().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ProfileFilters = z.infer<typeof profileFiltersSchema>;