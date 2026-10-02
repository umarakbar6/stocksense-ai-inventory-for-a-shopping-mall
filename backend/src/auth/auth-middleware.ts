import type { RequestHandler } from "express";
import type { Role } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../database/prisma.js";
import { AppError } from "../http/app-error.js";
import { asyncHandler } from "../http/async-handler.js";
import { verifyAuthToken } from "./auth-token.js";

export const requireAuth = asyncHandler(async (request, _response, next) => {
  const token = request.cookies?.[env.AUTH_COOKIE_NAME] as string | undefined;
  if (!token) throw new AppError(401, "AUTH_REQUIRED", "Please sign in to continue.");

  let userId: string;
  try {
    userId = await verifyAuthToken(token);
  } catch {
    throw new AppError(401, "AUTH_REQUIRED", "Your session is invalid or expired. Please sign in again.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!user?.isActive) throw new AppError(401, "AUTH_REQUIRED", "This account is unavailable.");

  request.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  next();
});

export function requireRole(...roles: Role[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.user) return next(new AppError(401, "AUTH_REQUIRED", "Please sign in to continue."));
    if (!roles.includes(request.user.role)) return next(new AppError(403, "FORBIDDEN", "You do not have permission for this action."));
    next();
  };
}

