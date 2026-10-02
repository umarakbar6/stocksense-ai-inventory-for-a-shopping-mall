import argon2 from "argon2";
import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { prisma } from "../database/prisma.js";
import { AppError } from "../http/app-error.js";
import { asyncHandler } from "../http/async-handler.js";
import { requireAuth } from "./auth-middleware.js";
import { issueAuthToken } from "./auth-token.js";
import { rateLimit } from "../security/request-security.js";

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(200),
});

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  maxAge: 8 * 60 * 60 * 1000,
  path: "/",
};

export const authRouter = Router();

authRouter.post("/login", rateLimit({ windowMs: 15 * 60_000, max: 10, scope: "login" }), asyncHandler(async (request, response) => {
  const input = loginSchema.parse(request.body);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user?.isActive || !(await argon2.verify(user.passwordHash, input.password))) {
    throw new AppError(401, "INVALID_CREDENTIALS", "The email or password is incorrect.");
  }

  response.cookie(env.AUTH_COOKIE_NAME, await issueAuthToken(user.id), cookieOptions);
  response.json({ data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
}));

authRouter.post("/logout", (_request, response) => {
  response.clearCookie(env.AUTH_COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  response.status(204).send();
});

authRouter.get("/me", requireAuth, (request, response) => {
  response.json({ data: { user: request.user } });
});

