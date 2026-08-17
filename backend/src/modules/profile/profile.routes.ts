import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import * as service from "./profile.service.js";
import { profileUpdateSchema, profileFiltersSchema } from "./profile.schema.js";

export const profileRouter = Router();

profileRouter.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    res.json(await service.getMyProfile(req.userId!));
  } catch (e) {
    next(e);
  }
});

profileRouter.put("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const input = profileUpdateSchema.parse(req.body);
    res.json(await service.upsertMyProfile(req.userId!, input));
  } catch (e) {
    next(e);
  }
});

profileRouter.get("/", async (req, res, next) => {
  try {
    const filters = profileFiltersSchema.parse(req.query);
    const excludeUserId = (req as AuthedRequest).userId;
    res.json(await service.listProfiles(filters, excludeUserId));
  } catch (e) {
    next(e);
  }
});

profileRouter.get("/:id", async (req, res, next) => {
  try {
    res.json(await service.getProfileById(req.params.id));
  } catch (e) {
    next(e);
  }
});