import { prisma } from "../../lib/prisma.js";
import { Errors } from "../../lib/errors.js";
import type { ProfileUpdateInput, ProfileFilters } from "./profile.schema.js";

type ProfileRow = {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  cleanliness: number;
  socialEnergy: number;
  sleepSchedule: string;
  nonNegotiables: string[];
  budgetMin: number;
  budgetMax: number;
  budgetCurrency: string;
  groupIntent: string;
  university: string;
  campus: string;
};

function toApiProfile(p: ProfileRow) {
  return {
    id: p.id,
    userId: p.userId,
    displayName: p.displayName,
    bio: p.bio,
    avatarUrl: p.avatarUrl,
    cleanliness: p.cleanliness,
    socialEnergy: p.socialEnergy,
    sleepSchedule: p.sleepSchedule,
    nonNegotiables: p.nonNegotiables,
    budget: { min: p.budgetMin, max: p.budgetMax, currency: p.budgetCurrency },
    groupIntent: p.groupIntent,
    university: p.university,
    campus: p.campus,
  };
}

export async function getMyProfile(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) throw Errors.NotFound("Profile not found — create one first");
  return { profile: toApiProfile(profile) };
}

export async function upsertMyProfile(userId: string, input: ProfileUpdateInput) {
  const profile = await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      displayName: input.displayName,
      bio: input.bio,
      cleanliness: input.cleanliness,
      socialEnergy: input.socialEnergy,
      sleepSchedule: input.sleepSchedule,
      nonNegotiables: input.nonNegotiables,
      budgetMin: input.budget.min,
      budgetMax: input.budget.max,
      budgetCurrency: input.budget.currency,
      groupIntent: input.groupIntent,
      university: input.university,
      campus: input.campus,
    },
    update: {
      displayName: input.displayName,
      bio: input.bio,
      cleanliness: input.cleanliness,
      socialEnergy: input.socialEnergy,
      sleepSchedule: input.sleepSchedule,
      nonNegotiables: input.nonNegotiables,
      budgetMin: input.budget.min,
      budgetMax: input.budget.max,
      budgetCurrency: input.budget.currency,
      groupIntent: input.groupIntent,
      university: input.university,
      campus: input.campus,
    },
  });

  // Completing a profile promotes the user to Tier 3 (group formation unlocked).
  await prisma.user.updateMany({
    where: { id: userId, tier: { lt: 3 } },
    data: { tier: 3 },
  });

  return { profile: toApiProfile(profile) };
}

export async function listProfiles(filters: ProfileFilters, excludeUserId?: string) {
  const where: Record<string, unknown> = {};

  if (excludeUserId) {
    where.userId = { not: excludeUserId };
  }
  if (filters.q) {
    where.OR = [
      { displayName: { contains: filters.q, mode: "insensitive" } },
      { university: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.group_intent) {
    where.groupIntent = filters.group_intent;
  }
  if (filters.budget_max) {
    where.budgetMax = { lte: filters.budget_max };
  }
  if (filters.campus) {
    where.campus = filters.campus;
  }

  const profiles = await prisma.profile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return { profiles: profiles.map(toApiProfile), total: profiles.length };
}

export async function getProfileById(id: string) {
  const profile = await prisma.profile.findUnique({ where: { id } });
  if (!profile) throw Errors.NotFound("Profile not found");
  return { profile: toApiProfile(profile) };
}