import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { profileRouter } from "./modules/profile/profile.routes.js";
import { swipeRouter, matchRouter } from "./modules/swipe/swipe.routes.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "groupup-backend", env: env.NODE_ENV });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/profiles", profileRouter);
  app.use("/api/swipe", swipeRouter);
  app.use("/api/matches", matchRouter);

  app.use(errorHandler);
  return app;
}