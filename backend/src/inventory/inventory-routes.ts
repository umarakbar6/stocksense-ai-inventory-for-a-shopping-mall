import { MovementSource, MovementType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth-middleware.js";
import { prisma } from "../database/prisma.js";
import { asyncHandler } from "../http/async-handler.js";
import { createMovement } from "./inventory-service.js";

const movementSchema = z.object({
  productId: z.string().uuid(),
  type: z.nativeEnum(MovementType),
  quantity: z.number().int().min(1).max(1_000_000),
  supplierId: z.string().uuid().optional(),
  reason: z.string().trim().max(500).optional(),
});
const historySchema = z.object({
  productId: z.string().uuid().optional(),
  type: z.nativeEnum(MovementType).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const inventoryRouter = Router();
inventoryRouter.use(requireAuth);

inventoryRouter.post("/movements", asyncHandler(async (request, response) => {
  const input = movementSchema.parse(request.body);
  const result = await createMovement({ ...input, actorUserId: request.user!.id, actorRole: request.user!.role, source: MovementSource.FORM });
  response.status(201).json({ data: result });
}));

inventoryRouter.get("/movements", asyncHandler(async (request, response) => {
  const input = historySchema.parse(request.query);
  const where = {
    ...(input.productId ? { productId: input.productId } : {}),
    ...(input.type ? { type: input.type } : {}),
    ...(input.from || input.to ? { occurredAt: { ...(input.from ? { gte: input.from } : {}), ...(input.to ? { lte: input.to } : {}) } } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.stockMovement.findMany({
      where,
      include: { product: { select: { id: true, sku: true, name: true } }, actor: { select: { id: true, name: true } }, supplier: { select: { id: true, name: true } } },
      orderBy: { occurredAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.stockMovement.count({ where }),
  ]);
  response.json({ data: { items, page: input.page, pageSize: input.pageSize, total } });
}));

inventoryRouter.get("/summary", asyncHandler(async (_request, response) => {
  const [totalProducts, units, outOfStock, lowStock] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.aggregate({ where: { isActive: true }, _sum: { quantity: true } }),
    prisma.product.count({ where: { isActive: true, quantity: 0 } }),
    prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM products WHERE is_active = true AND quantity <= low_stock_threshold`,
  ]);
  response.json({ data: { totalProducts, totalUnits: units._sum.quantity ?? 0, outOfStock, lowStock: Number(lowStock[0]?.count ?? 0) } });
}));

