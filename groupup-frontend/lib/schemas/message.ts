import { z } from "zod";

export const MessageSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  senderId: z.string(),
  content: z.string().min(1),
  createdAt: z.string(),
});

export const MessagePayloadSchema = z.object({
  groupId: z.string(),
  content: z.string().min(1),
});

export type Message = z.infer<typeof MessageSchema>;
export type MessagePayload = z.infer<typeof MessagePayloadSchema>;
