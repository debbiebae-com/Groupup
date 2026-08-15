import { z } from "zod";

export const SwipeSchema = z.object({
  targetProfileId: z.string(),
  action: z.enum(["LIKE", "PASS"]),
});

export const GroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  intent: z.string(),
  members: z
    .array(
      z.object({
        userId: z.string(),
        joinedAt: z.string(),
      })
    )
    .min(2)
    .max(6),
  createdAt: z.string(),
});

export type Swipe = z.infer<typeof SwipeSchema>;
export type Group = z.infer<typeof GroupSchema>;
