import { io, type Socket } from "socket.io-client";

const SIGNALING_URL = process.env.NEXT_PUBLIC_SIGNALING_URL;
const MOCK_SETTING = process.env.NEXT_PUBLIC_USE_MOCK_API;
const USE_MOCK = MOCK_SETTING === "true" || (process.env.NODE_ENV === "development" && MOCK_SETTING !== "false");

let socket: Socket | null = null;

export function getSocket(token?: string | null): Socket | null {
  if (USE_MOCK || !SIGNALING_URL) return null;
  if (!socket) {
    socket = io(SIGNALING_URL, {
      autoConnect: false,
      auth: token ? { token } : undefined,
    });
  }
  return socket;
}

export function connectSocket(token?: string | null): Socket | null {
  const current = getSocket(token);
  if (current && !current.connected) current.connect();
  return current;
}
