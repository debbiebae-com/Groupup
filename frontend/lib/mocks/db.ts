import { mockCurrentUser } from "./mockData/users";
import { mockProfiles } from "./mockData/profiles";
import { mockGroups } from "./mockData/groups";
import type { Message, Match, Profile } from "@/types/api";

export const db = {
  currentUser: { ...mockCurrentUser },
  profiles: [...mockProfiles] as Profile[],
  groups: [...mockGroups],
  matches: [] as Match[],
  messages: [] as Message[],
};

const seedMessages: Message[] = [
  {
    id: "m_1",
    groupId: "g_1",
    senderId: "u_2",
    content: "Hey! Anyone free to tour that place on Friday?",
    createdAt: "2026-08-10T14:00:00Z",
  },
  {
    id: "m_2",
    groupId: "g_1",
    senderId: "u_me",
    content: "Friday works for me after 3pm.",
    createdAt: "2026-08-10T14:05:00Z",
  },
];

db.messages = [...seedMessages];
