import { Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../auth/auth-middleware.js";
import { asyncHandler } from "../http/async-handler.js";
import { getFinancialSummary, getLowStock, getTopSelling } from "./report-service.js";

const rangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
}).refine((value) => value.from <= value.to, { message: "The from date must not be after the to date." });

export const reportRouter = Router();
reportRouter.use(requireAuth);

reportRouter.get("/low-stock", asyncHandler(async (request, response) => {
  const items = await getLowStock(request.user!.role);
  response.json({ data: { items } });
}));

reportRouter.get("/top-selling", asyncHandler(async (request, response) => {
  const input = rangeSchema.parse(request.query);
  const items = await getTopSelling(input.from, input.to, input.limit);
  response.json({ data: { from: input.from, to: input.to, items } });
}));

reportRouter.get("/financial-summary", requireRole(Role.MANAGER), asyncHandler(async (request, response) => {
  const input = rangeSchema.parse(request.query);
  const result = await getFinancialSummary(input.from, input.to);
  response.json({ data: { ...result, profitMinor: result.revenueMinor - result.costMinor, from: input.from, to: input.to } });
}));

