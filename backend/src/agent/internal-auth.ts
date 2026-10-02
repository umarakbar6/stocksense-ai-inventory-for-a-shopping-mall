import { timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { env } from "../config/env.js";
import { AppError } from "../http/app-error.js";
import { verifyAgentContext } from "./context-token.js";
import { prisma } from "../database/prisma.js";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function authorizeAgentTool(request: Request) {
  const authorization = request.header("authorization") ?? "";
  const expected = `Bearer ${env.AGENT_SERVICE_SECRET}`;
  if (!safeEqual(authorization, expected)) throw new AppError(401, "AUTH_REQUIRED", "Agent service authentication failed.");
  const contextRef = typeof request.body?.contextRef === "string" ? request.body.contextRef : "";
  if (!contextRef) throw new AppError(400, "VALIDATION_FAILED", "A signed user context is required.");
  try {
    const context = await verifyAgentContext(contextRef);
    const user = await prisma.user.findUnique({ where: { id: context.sub }, select: { role: true, isActive: true } });
    if (!user?.isActive) throw new Error("User is inactive.");
    return { ...context, role: user.role };
  } catch {
    throw new AppError(401, "AUTH_REQUIRED", "Agent user context is invalid or expired.");
  }
}
