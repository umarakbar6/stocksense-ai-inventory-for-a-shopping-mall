import { Router } from "express";
import { requireAuth } from "../auth/auth-middleware.js";
import { prisma } from "../database/prisma.js";
import { asyncHandler } from "../http/async-handler.js";

export const referenceRouter = Router();
referenceRouter.use(requireAuth);

referenceRouter.get("/categories", asyncHandler(async (_request, response) => {
  const items = await prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, description: true } });
  response.json({ data: { items } });
}));

referenceRouter.get("/suppliers", asyncHandler(async (_request, response) => {
  const items = await prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, phone: true, email: true } });
  response.json({ data: { items } });
}));

