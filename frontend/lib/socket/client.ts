import { io, type Socket } from "socket.io-client";
import { isMockMode } from "@/lib/mocks/mode";

const SIGNALING_URL = process.env.NEXT_PUBLIC_SIGNALING_URL;
let socket: Socket | null = null;

export function getSocket(token?: string | null): Socket | null {
  if (isMockMode() || !SIGNALING_URL) return null;
  if (!socket) {
    socket = io(SIGNALING_URL, { autoConnect: false, auth: token ? { token } : undefined });
  }
  return socket;
}

export function connectSocket(token?: string | null): Socket | null {
  const current = getSocket(token);
  if (current && !current.connected) current.connect();
  return current;
}
