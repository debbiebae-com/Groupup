import { apiFetch } from "./client";
import type { Profile, ProfileUpdatePayload } from "@/types/api";

export interface ProfileFilters {
  q?: string;
  group_intent?: string;
  budget_max?: number;
  campus?: string;
}

export async function getProfiles(filters: ProfileFilters = {}): Promise<{ profiles: Profile[]; total: number }> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== 0) {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return apiFetch<{ profiles: Profile[]; total: number }>(`/profiles${qs ? `?${qs}` : ""}`);
}

export async function getMyProfile(): Promise<{ profile: Profile }> {
  return apiFetch<{ profile: Profile }>("/profiles/me");
}

export async function getProfileById(id: string): Promise<{ profile: Profile }> {
  return apiFetch<{ profile: Profile }>(`/profiles/${id}`);
}

export async function updateMyProfile(data: ProfileUpdatePayload): Promise<{ profile: Profile }> {
  return apiFetch<{ profile: Profile }>("/profiles/me", {
    method: "PUT",
    body: data,
  });
}
