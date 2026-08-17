import { prisma } from "../../lib/prisma.js";
import { Errors } from "../../lib/errors.js";
import type { SwipeInput } from "./swipe.schema.js";

async function ensureMatch(a: string, b: string) {
  // Normalize so (A,B) and (B,A) map to the same row — prevents duplicates.
  const [userAId, userBId] = a < b ? [a, b] : [b, a];
  const existing = await prisma.match.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
  });
  if (existing) return existing;
  return prisma.match.create({ data: { userAId, userBId } });
}

export async function swipe(userId: string, input: SwipeInput) {
  const myProfile = await prisma.profile.findUnique({ where: { userId } });
  if (!myProfile) throw Errors.BadRequest("Create a profile before swiping");

  const targetProfile = await prisma.profile.findUnique({
    where: { id: input.targetProfileId },
  });
  if (!targetProfile) throw Errors.NotFound("Profile not found");
  if (targetProfile.userId === userId) throw Errors.BadRequest("You cannot swipe on yourself");

  await prisma.swipe.create({
    data: {
      swiperId: userId,
      targetProfileId: input.targetProfileId,
      action: input.action,
    },
  });

  if (input.action !== "LIKE") {
    return { isMatch: false };
  }

  // Double-opt-in: does the target have a LIKE swipe back at my profile?
  const reverse = await prisma.swipe.findFirst({
    where: {
      swiperId: targetProfile.userId,
      targetProfileId: myProfile.id,
      action: "LIKE",
    },
  });

  if (!reverse) {
    return { isMatch: false };
  }

  const match = await ensureMatch(userId, targetProfile.userId);
  return { isMatch: true, matchId: match.id };
}

export async function getMatches(userId: string) {
  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    orderBy: { createdAt: "desc" },
  });

  const results = [];
  for (const m of matches) {
    const otherUserId = m.userAId === userId ? m.userBId : m.userAId;
    const p = await prisma.profile.findUnique({ where: { userId: otherUserId } });
    if (!p) continue;
    results.push({
      id: m.id,
      profileId: p.id,
      matchedUserId: otherUserId,
      createdAt: m.createdAt,
      profile: {
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
      },
    });
  }

  return { matches: results };
}