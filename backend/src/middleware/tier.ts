import type { NextFunction, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { Errors } from "../lib/errors.js";
import type { AuthedRequest } from "./auth.js";

export function requireTier(minTier: 1 | 2 | 3) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;
    if (!userId) return next(Errors.Unauthorized("Missing bearer token"));

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return next(Errors.Unauthorized("User not found"));

    if (user.tier < minTier) {
      return next(
        Errors.Forbidden(
          `This action requires tier ${minTier}. Complete verification and profile setup to unlock it.`
        )
      );
    }
    next();
  };
}