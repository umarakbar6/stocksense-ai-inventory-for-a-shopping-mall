import { Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../auth/auth-middleware.js";
import { prisma } from "../database/prisma.js";
import { AppError } from "../http/app-error.js";
import { asyncHandler } from "../http/async-handler.js";
import { serializeProduct } from "./product-serializer.js";

const idSchema = z.string().uuid();
const listSchema = z.object({
  search: z.string().trim().max(160).optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(["active", "inactive", "all"]).default("active"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
const createSchema = z.object({
  sku: z.string().trim().min(2).max(64).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).nullable().optional(),
  categoryId: z.string().uuid(),
  lowStockThreshold: z.number().int().min(0).max(1_000_000),
  sellingPriceMinor: z.number().int().min(0).max(2_000_000_000),
  costPriceMinor: z.number().int().min(0).max(2_000_000_000),
});
const updateSchema = createSchema.partial().extend({ isActive: z.boolean().optional() }).refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be supplied.",
);

export const productRouter = Router();
productRouter.use(requireAuth);

productRouter.get("/", asyncHandler(async (request, response) => {
  const input = listSchema.parse(request.query);
  const where = {
    ...(input.search ? { OR: [{ name: { contains: input.search, mode: "insensitive" as const } }, { sku: { contains: input.search, mode: "insensitive" as const } }] } : {}),
    ...(input.categoryId ? { categoryId: input.categoryId } : {}),
    ...(input.status === "all" ? {} : { isActive: input.status === "active" }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({ where, include: { category: true }, orderBy: { name: "asc" }, skip: (input.page - 1) * input.pageSize, take: input.pageSize }),
    prisma.product.count({ where }),
  ]);
  response.json({ data: { items: items.map((item) => serializeProduct(item, request.user!.role)), page: input.page, pageSize: input.pageSize, total } });
}));

productRouter.get("/:id", asyncHandler(async (request, response) => {
  const id = idSchema.parse(request.params.id);
  const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
  if (!product) throw new AppError(404, "NOT_FOUND", "Product not found.");
  response.json({ data: { product: serializeProduct(product, request.user!.role) } });
}));

productRouter.post("/", requireRole(Role.MANAGER), asyncHandler(async (request, response) => {
  const input = createSchema.parse(request.body);
  const product = await prisma.product.create({ data: { ...input, quantity: 0 }, include: { category: true } });
  await prisma.auditEvent.create({ data: { actorUserId: request.user!.id, action: "PRODUCT_CREATED", entityType: "Product", entityId: product.id, requestId: response.locals.requestId, metadata: { sku: product.sku } } });
  response.status(201).json({ data: { product: serializeProduct(product, request.user!.role) } });
}));

productRouter.patch("/:id", requireRole(Role.MANAGER), asyncHandler(async (request, response) => {
  const id = idSchema.parse(request.params.id);
  const input = updateSchema.parse(request.body);
  const existing = await prisma.product.findUnique({ where: { id }, include: { category: true } });
  if (!existing) throw new AppError(404, "NOT_FOUND", "Product not found.");
  const product = await prisma.product.update({ where: { id }, data: { ...input, version: { increment: 1 } }, include: { category: true } });
  await prisma.auditEvent.create({
    data: {
      actorUserId: request.user!.id,
      action: input.costPriceMinor !== undefined || input.sellingPriceMinor !== undefined ? "PRODUCT_PRICE_UPDATED" : "PRODUCT_UPDATED",
      entityType: "Product",
      entityId: id,
      requestId: response.locals.requestId,
      metadata: { changedFields: Object.keys(input) },
    },
  });
  response.json({ data: { product: serializeProduct(product, request.user!.role) } });
}));

