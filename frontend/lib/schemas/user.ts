import { z } from "zod";

export const VerificationStatusSchema = z.enum(["UNVERIFIED", "PENDING", "VERIFIED"]);

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email().regex(/\.edu$/i, "Must be a .edu email"),
  displayName: z.string().min(1),
  verificationStatus: VerificationStatusSchema,
  badges: z.array(z.string()),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export type User = z.infer<typeof UserSchema>;
