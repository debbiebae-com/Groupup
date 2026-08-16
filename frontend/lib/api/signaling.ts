import { apiFetch } from "./client";

export async function sendOffer(groupId: string, sdp: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/signaling/offer", {
    method: "POST",
    body: { groupId, type: "offer", sdp },
  });
}

export async function sendAnswer(groupId: string, sdp: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/signaling/answer", {
    method: "POST",
    body: { groupId, type: "answer", sdp },
  });
}
