import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(1).max(80),
  memberUserIds: z.array(z.string().min(1)).min(1).max(5),
});

export const sendMessageSchema = z.object({
  groupId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;