import { z } from "zod";

export const GroupIntentSchema = z.enum(["SOLO_NEW", "PAIR_ADD", "SOLO_JOIN"]);
export const SleepScheduleSchema = z.enum(["EARLY_BIRD", "NIGHT_OWL", "FLEXIBLE"]);

export const ProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  displayName: z.string().min(1),
  bio: z.string().max(300).default(""),
  avatarUrl: z.string().url().nullable(),
  cleanliness: z.number().int().min(1).max(10),
  socialEnergy: z.number().int().min(1).max(10),
  sleepSchedule: SleepScheduleSchema,
  nonNegotiables: z.array(z.string()),
  budget: z.object({
    min: z.number().int().min(0),
    max: z.number().int().min(0),
    currency: z.string().default("USD"),
  }),
  groupIntent: GroupIntentSchema,
  university: z.string().min(1),
  campus: z.string().min(1),
  compatibilityScore: z.number().optional(),
});

export const ProfileUpdatePayloadSchema = ProfileSchema.omit({
  id: true,
  userId: true,
  avatarUrl: true,
});

export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileUpdatePayload = z.infer<typeof ProfileUpdatePayloadSchema>;
