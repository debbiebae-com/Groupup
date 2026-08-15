import { sendOffer, sendAnswer } from "@/lib/api/signaling";

const USE_MOCK = process.env.USE_MOCK_API === "true";

export class SignalingService {
  static async offer(groupId: string, sdp: string): Promise<void> {
    if (USE_MOCK) {
      await sendOffer(groupId, sdp);
      return;
    }
    // Real mode: Socket.io signaling (wired in F013)
    throw new Error("Real signaling not configured");
  }

  static async answer(groupId: string, sdp: string): Promise<void> {
    if (USE_MOCK) {
      await sendAnswer(groupId, sdp);
      return;
    }
    throw new Error("Real signaling not configured");
  }
}