import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().regex(/\.edu$/i, "Must be a .edu email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1).max(60),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const requestVerifySchema = z.object({
  email: z.string().email().regex(/\.edu$/i, "Must be a .edu email"),
});

export const confirmVerifySchema = z.object({
  email: z.string().email(),
  token: z.string().min(6),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RequestVerifyInput = z.infer<typeof requestVerifySchema>;
export type ConfirmVerifyInput = z.infer<typeof confirmVerifySchema>;