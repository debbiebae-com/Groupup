// Shared API types — single source of truth for forms, MSW handlers, and components.

export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED";

export type GroupIntent = "SOLO_NEW" | "PAIR_ADD" | "SOLO_JOIN";

export type SleepSchedule = "EARLY_BIRD" | "NIGHT_OWL" | "FLEXIBLE";

export interface User {
  id: string;
  email: string;
  displayName: string;
  verificationStatus: VerificationStatus;
  badges: string[];
  tier: 1 | 2 | 3;
}

export interface Profile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  cleanliness: number;
  socialEnergy: number;
  sleepSchedule: SleepSchedule;
  nonNegotiables: string[];
  budget: { min: number; max: number; currency: string };
  groupIntent: GroupIntent;
  university: string;
  campus: string;
  compatibilityScore?: number;
}

export interface ProfileUpdatePayload {
  displayName: string;
  bio: string;
  cleanliness: number;
  socialEnergy: number;
  sleepSchedule: SleepSchedule;
  nonNegotiables: string[];
  budget: { min: number; max: number; currency: string };
  groupIntent: GroupIntent;
  university: string;
  campus: string;
}

export type SwipeAction = "LIKE" | "PASS";

export interface SwipePayload {
  targetProfileId: string;
  action: SwipeAction;
}

export interface SwipeResponse {
  isMatch: boolean;
  matchId?: string;
}

export interface Match {
  id: string;
  profileId: string;
  matchedUserId: string;
  createdAt: string;
  profile: Profile;
}

export interface GroupMembership {
  userId: string;
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  intent: string;
  members: GroupMembership[];
  createdAt: string;
}

export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface MessagePayload {
  groupId: string;
  content: string;
}

export interface VideoSignalingPayload {
  groupId: string;
  type: "offer" | "answer";
  sdp: string;
}

export interface VerificationToken {
  token: string;
  email: string;
}
