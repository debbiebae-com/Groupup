import { apiFetch } from "./client";
import type { Message, MessagePayload } from "@/types/api";

export async function getMessages(groupId: string): Promise<{ messages: Message[] }> {
  return apiFetch<{ messages: Message[] }>(`/messages?groupId=${groupId}`);
}

export async function sendMessage(payload: MessagePayload): Promise<{ message: Message }> {
  return apiFetch<{ message: Message }>("/messages", {
    method: "POST",
    body: payload,
  });
}
