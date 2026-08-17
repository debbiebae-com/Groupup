import { apiFetch } from "./client";
import type { User } from "@/types/api";

export async function getCurrentUser(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>("/auth/me");
}

export async function register(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ token: string; user: User }> {
  return apiFetch<{ token: string; user: User }>("/auth/register", {
    method: "POST",
    body: input,
  });
}

export async function login(input: {
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
  devToken: string;
  expiresInMinutes: number;
}> {
  return apiFetch("/auth/verify", { method: "POST", body: { email } });
}

export async function confirmVerification(email: string, token: string): Promise<{ user: User }> {
  return apiFetch<{ user: User }>("/auth/verify/confirm", {
    method: "POST",
    body: { email, token },
  });
}

export async function updateProfile(data: unknown): Promise<{ profile: unknown }> {
  return apiFetch<{ profile: unknown }>("/profiles/me", { method: "PUT", body: data });
}