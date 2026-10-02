import { MovementType, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../database/prisma.js";
import { AppError } from "../http/app-error.js";
import { asyncHandler } from "../http/async-handler.js";
import { serializeProduct } from "../products/product-serializer.js";
import { getFinancialSummary, getLowStock, getTopSelling } from "../reports/report-service.js";
import { authorizeAgentTool } from "./internal-auth.js";
import { prepareProposal } from "../proposals/proposal-service.js";

const contextSchema = z.object({ contextRef: z.string().min(1) });
const searchSchema = contextSchema.extend({ query: z.string().trim().min(1).max(160) });
const rangeSchema = contextSchema.extend({
  from: z.coerce.date(),
  to: z.coerce.date(),
  limit: z.number().int().min(1).max(20).default(5),
}).refine((value) => value.from <= value.to, "The from date must not be after the to date.");
const prepareSchema = contextSchema.extend({
  productQuery: z.string().trim().min(1).max(160),
  supplierName: z.string().trim().min(1).max(160).nullable().optional(),
  movementType: z.nativeEnum(MovementType),
  quantity: z.number().int().min(1).max(1_000_000),
  reason: z.string().trim().max(500).nullable().optional(),
  idempotencyKey: z.string().trim().min(8).max(160),
});

function productQueryTerms(query: string) {
  const normalized = query.trim();
  const singular = normalized.endsWith("s") ? normalized.slice(0, -1) : normalized;
  return [...new Set([normalized, singular])];
}

function productSearchWhere(query: string) {
  return {
    isActive: true,
    OR: productQueryTerms(query).flatMap((term) => [
      { name: { contains: term, mode: "insensitive" as const } },
      { sku: { contains: term, mode: "insensitive" as const } },
    ]),
  };
}

export const internalAgentToolRouter = Router();

internalAgentToolRouter.post("/search-products", asyncHandler(async (request, response) => {
  const context = await authorizeAgentTool(request);
  const input = searchSchema.parse(request.body);
  const products = await prisma.product.findMany({
    where: productSearchWhere(input.query),
    include: { category: true }, orderBy: { name: "asc" }, take: 10,
  });
  response.json({ data: { toolResultId: response.locals.requestId, items: products.map((item) => serializeProduct(item, context.role)) } });
}));

internalAgentToolRouter.post("/stock-levels", asyncHandler(async (request, response) => {
  const context = await authorizeAgentTool(request);
  const input = searchSchema.parse(request.body);
  const products = await prisma.product.findMany({
    where: productSearchWhere(input.query),
    include: { category: true }, orderBy: { name: "asc" }, take: 10,
  });
  response.json({ data: { toolResultId: response.locals.requestId, items: products.map((item) => serializeProduct(item, context.role)) } });
}));

internalAgentToolRouter.post("/low-stock", asyncHandler(async (request, response) => {
  const context = await authorizeAgentTool(request);
  contextSchema.parse(request.body);
  response.json({ data: { toolResultId: response.locals.requestId, items: await getLowStock(context.role) } });
}));

internalAgentToolRouter.post("/top-selling", asyncHandler(async (request, response) => {
  await authorizeAgentTool(request);
  const input = rangeSchema.parse(request.body);
  response.json({ data: { toolResultId: response.locals.requestId, from: input.from, to: input.to, items: await getTopSelling(input.from, input.to, input.limit) } });
}));

internalAgentToolRouter.post("/financial-summary", asyncHandler(async (request, response) => {
  const context = await authorizeAgentTool(request);
  if (context.role !== Role.MANAGER) throw new AppError(403, "FORBIDDEN", "Financial information is available to managers only.");
  const input = rangeSchema.parse(request.body);
  response.json({ data: { toolResultId: response.locals.requestId, from: input.from, to: input.to, ...(await getFinancialSummary(input.from, input.to)) } });
}));

internalAgentToolRouter.post("/prepare-movement", asyncHandler(async (request, response) => {
  const context = await authorizeAgentTool(request);
  const input = prepareSchema.parse(request.body);
  const products = await prisma.product.findMany({ where: productSearchWhere(input.productQuery), orderBy: { name: "asc" }, take: 3 });
  if (!products.length) throw new AppError(404, "NOT_FOUND", "No active product matches that name or SKU.");
  if (products.length > 1) throw new AppError(409, "AMBIGUOUS_PRODUCT", "More than one product matches. Please use the exact product name or SKU.", { matches: products.map(({ id, name, sku }) => ({ id, name, sku })) });
  const product = products[0]!;

  let supplierId: string | undefined;
  if (input.supplierName) {
    const suppliers = await prisma.supplier.findMany({ where: { isActive: true, name: { contains: input.supplierName, mode: "insensitive" } }, orderBy: { name: "asc" }, take: 3 });
    if (!suppliers.length) throw new AppError(404, "NOT_FOUND", "No active supplier matches that name.");
    if (suppliers.length > 1) throw new AppError(409, "AMBIGUOUS_SUPPLIER", "More than one supplier matches. Please use the exact supplier name.");
    supplierId = suppliers[0]!.id;
  }

  const proposal = await prepareProposal({ actorUserId: context.sub, actorRole: context.role, productId: product.id, supplierId, movementType: input.movementType, quantity: input.quantity, reason: input.reason ?? undefined, idempotencyKey: input.idempotencyKey });
  response.status(201).json({ data: { toolResultId: response.locals.requestId, proposal } });
}));
