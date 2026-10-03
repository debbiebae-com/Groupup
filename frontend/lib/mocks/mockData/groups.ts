import type { Group } from "@/types/api";

export const mockGroups: Group[] = [
  {
    id: "g_1",
    name: "Campus West 3BR",
    intent: "SOLO_NEW",
    members: [
      { userId: "u_me", joinedAt: "2026-08-01T10:00:00Z" },
      { userId: "u_1", joinedAt: "2026-08-02T10:00:00Z" },
      { userId: "u_3", joinedAt: "2026-08-03T10:00:00Z" },
    ],
    createdAt: "2026-08-01T10:00:00Z",
  },
  {
    id: "g_2",
    name: "The Sunday Reset",
    intent: "PAIR_ADD",
    members: [
      { userId: "u_me", joinedAt: "2026-08-05T10:00:00Z" },
      { userId: "u_5", joinedAt: "2026-08-06T10:00:00Z" },
    ],
    createdAt: "2026-08-05T10:00:00Z",
  },
];
