import { mockCurrentUser } from "./mockData/users";
import { mockProfiles } from "./mockData/profiles";
import { mockGroups } from "./mockData/groups";
import type { Match, Message, Profile, User } from "@/types/api";

const currentProfile: Profile = {
  id: "p_me",
  userId: mockCurrentUser.id,
  displayName: mockCurrentUser.displayName,
  bio: "Design student, market wanderer and believer that home should feel easy to come back to.",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=85",
  cleanliness: 8,
  socialEnergy: 7,
  sleepSchedule: "FLEXIBLE",
  nonNegotiables: ["quiet study hours", "shared dinners"],
  budget: { min: 650, max: 1000, currency: "USD" },
  groupIntent: "SOLO_NEW",
  university: "National University",
  campus: "Main Campus",
};

function makeMatch(profile: Profile, index: number): Match {
  return {
    id: `match_${index + 1}`,
    profileId: profile.id,
    matchedUserId: profile.userId,
    createdAt: `2026-09-${String(18 - index).padStart(2, "0")}T14:00:00.000Z`,
    profile,
  };
}

const initialMessages: Message[] = [
  {
    id: "m_1",
    groupId: "g_1",
    senderId: "u_1",
    content: "Hey! I found a place near the west gate that looks really promising 🌿",
    createdAt: "2026-09-22T14:00:00Z",
  },
  {
    id: "m_2",
    groupId: "g_1",
    senderId: "u_3",
    content: "Love the natural light in the kitchen. Could we tour after class on Thursday?",
    createdAt: "2026-09-22T14:07:00Z",
  },
  {
    id: "m_3",
    groupId: "g_1",
    senderId: "u_me",
    content: "Thursday works! I can bring a little checklist so we remember what to ask.",
    createdAt: "2026-09-22T14:13:00Z",
  },
  {
    id: "m_4",
    groupId: "g_2",
    senderId: "u_5",
    content: "Sunday reset playlist is ready. Anyone have a must-play?",
    createdAt: "2026-09-21T18:30:00Z",
  },
];

export const db: {
  currentUser: User;
  currentProfile: Profile;
  profiles: Profile[];
  groups: typeof mockGroups;
  matches: Match[];
  messages: Message[];
  swipes: Array<{ swiperId: string; targetProfileId: string; action: "LIKE" | "PASS" }>;
} = {
  currentUser: { ...mockCurrentUser },
  currentProfile: { ...currentProfile, userId: mockCurrentUser.id },
  profiles: [...mockProfiles],
  groups: mockGroups.map((group) => ({ ...group, members: [...group.members] })),
  matches: [mockProfiles[0], mockProfiles[2], mockProfiles[4]].map(makeMatch),
  messages: [...initialMessages],
  swipes: [],
};
