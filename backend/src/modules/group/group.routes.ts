import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import * as service from "./group.service.js";
import { createGroupSchema, sendMessageSchema } from "./group.schema.js";

export const groupRouter = Router();
export const messageRouter = Router();

groupRouter.post("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const input = createGroupSchema.parse(req.body);
    res.status(201).json(await service.createGroup(req.userId!, input));
  } catch (e) {
    next(e);
  }
});

groupRouter.get("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    res.json(await service.getMyGroups(req.userId!));
  } catch (e) {
    next(e);
  }
});

groupRouter.get("/:id", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    res.json(await service.getGroupById(req.userId!, String(req.params.id)));
  } catch (e) {
    next(e);
  }
});

messageRouter.get("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const groupId = String(req.query.groupId ?? "");
    res.json(await service.getMessages(req.userId!, groupId));
  } catch (e) {
    next(e);
  }
});

messageRouter.post("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const input = sendMessageSchema.parse(req.body);
    res.status(201).json(await service.sendMessage(req.userId!, input));
  } catch (e) {
    next(e);
  }
});