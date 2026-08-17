import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("unauthorized"));
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
      (socket as unknown as { userId: string }).userId = payload.sub;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = (socket as unknown as { userId: string }).userId;
    const memberships = await prisma.groupMember.findMany({ where: { userId } });
    memberships.forEach((m) => socket.join(`group:${m.groupId}`));
    console.log(`[socket] user ${userId} connected, joined ${memberships.length} room(s)`);

    socket.on("message", async (data: { groupId: string; content: string }, ack?: (r: unknown) => void) => {
      try {
        const msg = await prisma.message.create({
          data: { groupId: data.groupId, senderId: userId, content: data.content },
        });
        io?.to(`group:${data.groupId}`).emit("message", { groupId: data.groupId, message: msg });
        ack?.({ ok: true, message: msg });
      } catch (e) {
        ack?.({ ok: false, error: (e as Error).message });
      }
    });

    socket.on("offer", (data: { groupId: string; sdp: unknown }) => {
      socket.to(`group:${data.groupId}`).emit("offer", { from: userId, sdp: data.sdp });
    });

    socket.on("answer", (data: { groupId: string; sdp: unknown }) => {
      socket.to(`group:${data.groupId}`).emit("answer", { from: userId, sdp: data.sdp });
    });

    socket.on("disconnect", () => {
      console.log(`[socket] user ${userId} disconnected`);
    });
  });

  return io;
}

export function getIo(): Server | null {
  return io;
}