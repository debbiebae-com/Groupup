import { apiFetch } from "./client";
import type { Group } from "@/types/api";

export interface CreateGroupPayload {
  name: string;
  memberUserIds: string[];
}

export async function createGroup(data: CreateGroupPayload): Promise<{ group: Group }> {
  return apiFetch<{ group: Group }>("/groups", {
    method: "POST",
    body: data,
  });
}

export async function getMyGroups(): Promise<{ groups: Group[] }> {
  return apiFetch<{ groups: Group[] }>("/groups");
}

export async function getGroupById(id: string): Promise<{ group: Group }> {
  return apiFetch<{ group: Group }>(`/groups/${id}`);
}
