import { prisma } from "../../lib/prisma.js";
import { getIo } from "../../socket/index.js";
import { Errors } from "../../lib/errors.js";
import type { CreateGroupInput, SendMessageInput } from "./group.schema.js";

async function assertMembership(userId: string, groupId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) throw Errors.Forbidden("You are not a member of this group");
}

export async function createGroup(userId: string, input: CreateGroupInput) {
  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (!me || me.tier < 3) {
    throw Errors.Forbidden("Complete verification and profile setup to form groups");
  }

  const memberIds = [userId, ...input.memberUserIds];
  const unique = [...new Set(memberIds)];

  // Validate all invitees are mutual matches of the creator.
  for (const id of input.memberUserIds) {
    const [a, b] = userId < id ? [userId, id] : [id, userId];
    const match = await prisma.match.findUnique({
      where: { userAId_userBId: { userAId: a, userBId: b } },
    });
    if (!match) {
      throw Errors.BadRequest("You can only add users you have mutually matched with");
    }
  }

  const group = await prisma.group.create({
    data: {
      name: input.name,
      intent: "SOLO_NEW",
      members: {
        create: unique.map((id) => ({ userId: id })),
      },
    },
    include: { members: true },
  });

  return { group };
}

export async function getMyGroups(userId: string) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: { group: { include: { members: true } } },
    orderBy: { joinedAt: "desc" },
  });
  return { groups: memberships.map((m) => m.group) };
}

export async function getGroupById(userId: string, groupId: string) {
  await assertMembership(userId, groupId);
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!group) throw Errors.NotFound("Group not found");
  return { group };
}

export async function getMessages(userId: string, groupId: string) {
  await assertMembership(userId, groupId);
  const messages = await prisma.message.findMany({
    where: { groupId },
    orderBy: { createdAt: "asc" },
  });
  return { messages };
}

export async function sendMessage(userId: string, input: SendMessageInput) {
  await assertMembership(userId, input.groupId);
  const message = await prisma.message.create({
    data: {
      groupId: input.groupId,
      senderId: userId,
      content: input.content,
    },
  });
  getIo()?.to(`group:${input.groupId}`).emit("message", { groupId: input.groupId, message });
  return { message };
}