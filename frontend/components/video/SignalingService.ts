import { getSocket } from "@/lib/socket/client";

export class SignalingService {
  static async offer(groupId: string, sdp: string): Promise<void> {
    const socket = getSocket();
    if (socket) {
      socket.emit("offer", { groupId, sdp });
      return;
    }
    // Fallback: REST mock signaling (MSW)
    const { sendOffer } = await import("@/lib/api/signaling");
    await sendOffer(groupId, sdp);
  }

  static async answer(groupId: string, sdp: string): Promise<void> {
    const socket = getSocket();
    if (socket) {
      socket.emit("answer", { groupId, sdp });
      return;
    }
    const { sendAnswer } = await import("@/lib/api/signaling");
    await sendAnswer(groupId, sdp);
  }
}