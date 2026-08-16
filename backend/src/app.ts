import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "groupup-backend", env: env.NODE_ENV });
  });

  // Modules will be mounted here (Phase 2+):
  // app.use("/api/auth", authRouter);

  app.use(errorHandler);
  return app;
}