import { apiFetch } from "./client";
import type { SwipePayload, SwipeResponse, Match } from "@/types/api";

export async function sendSwipe(payload: SwipePayload): Promise<SwipeResponse> {
  return apiFetch<SwipeResponse>("/swipe", {
    method: "POST",
    body: payload,
  });
}

export async function getMatches(): Promise<{ matches: Match[] }> {
  return apiFetch<{ matches: Match[] }>("/matches");
}
