import { apiFetch } from "./client";
import type { User } from "@/types/api";

export function getCurrentUser(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>("/auth/me");
}

export function register(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ token: string; user: User }> {
  return apiFetch<{ token: string; user: User }>("/auth/register", {
    method: "POST",
    body: input,
  });
}

export function login(input: {
  email: string;
  password: string;
}): Promise<{ token: string; user: User }> {
  return apiFetch<{ token: string; user: User }>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export async function requestVerification(email: string): Promise<{
  message: string;
  devToken?: string;
  expiresInMinutes: number;
}> {
  return apiFetch("/auth/verify", { method: "POST", body: { email } });
}

export function confirmVerification(email: string, token: string): Promise<{ user: User }> {
  return apiFetch<{ user: User }>("/auth/verify/confirm", {
    method: "POST",
    body: { email, token },
  });
}
