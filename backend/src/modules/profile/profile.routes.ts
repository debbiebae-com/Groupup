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

profileRouter.get("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const filters = profileFiltersSchema.parse(req.query);
    res.json(await service.listProfiles(filters, req.userId));
  } catch (e) {
    next(e);
  }
});

profileRouter.get("/:id", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    res.json(await service.getProfileById(String(req.params.id)));
  } catch (e) {
    next(e);
  }
});