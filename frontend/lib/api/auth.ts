import { apiFetch } from "./client";
import type { User } from "@/types/api";

export async function getCurrentUser(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>("/auth/me");
}

export async function verifyStudentEmail(email: string): Promise<{ token: string; user: User }> {
  return apiFetch<{ token: string; user: User }>("/auth/verify", {
    method: "POST",
    body: { email },
  });
}

export async function updateProfile(data: unknown): Promise<{ profile: unknown }> {
  return apiFetch<{ profile: unknown }>("/profiles/me", {
    method: "PUT",
    body: data,
  });
}
