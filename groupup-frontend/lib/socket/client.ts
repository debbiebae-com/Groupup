import { io, type Socket } from "socket.io-client";

const SIGNALING_URL = process.env.NEXT_PUBLIC_SIGNALING_URL;
const USE_MOCK = process.env.USE_MOCK_API === "true";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (USE_MOCK || !SIGNALING_URL) {
    return null; // mock mode: use REST polling instead
  }
  if (!socket) {
    socket = io(SIGNALING_URL, { autoConnect: false });
  }
  return socket;
}

export function connectSocket(): Socket | null {
  const s = getSocket();
  if (s && !s.connected) {
    s.connect();
  }
  return s;
}