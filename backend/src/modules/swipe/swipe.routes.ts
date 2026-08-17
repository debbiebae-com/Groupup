import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import * as service from "./swipe.service.js";
import { swipeSchema } from "./swipe.schema.js";

export const swipeRouter = Router();
export const matchRouter = Router();

swipeRouter.post("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const input = swipeSchema.parse(req.body);
    res.json(await service.swipe(req.userId!, input));
  } catch (e) {
    next(e);
  }
});

matchRouter.get("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    res.json(await service.getMatches(req.userId!));
  } catch (e) {
    next(e);
  }
});