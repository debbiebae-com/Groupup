export type SocketEvent =
  | "message"
  | "group_joined"
  | "typing"
  | "user_connected";

export interface SocketMessageEvent {
  groupId: string;
  messageId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface TypingEvent {
  groupId: string;
  userId: string;
  isTyping: boolean;
}