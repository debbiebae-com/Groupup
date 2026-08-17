import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import * as service from "./auth.service.js";
import {
  registerSchema,
  loginSchema,
  requestVerifySchema,
  confirmVerifySchema,
} from "./auth.schema.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await service.register(input);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    res.json(await service.login(input));
  } catch (e) {
    next(e);
  }
});

authRouter.post("/verify", async (req, res, next) => {
  try {
    const { email } = requestVerifySchema.parse(req.body);
    res.json(await service.requestVerification(email));
  } catch (e) {
    next(e);
  }
});

authRouter.post("/verify/confirm", async (req, res, next) => {
  try {
    const input = confirmVerifySchema.parse(req.body);
    res.json(await service.confirmVerification(input));
  } catch (e) {
    next(e);
  }
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    res.json(await service.me(req.userId!));
  } catch (e) {
    next(e);
  }
});