import { MovementSource, MovementType, Prisma } from "@prisma/client";
import { prisma } from "../database/prisma.js";
import { AppError } from "../http/app-error.js";
import { movementDelta } from "./inventory-policy.js";

export type CreateMovementInput = {
  productId: string;
  actorUserId: string;
  actorRole: "MANAGER" | "STAFF";
  type: MovementType;
  quantity: number;
  supplierId?: string;
  reason?: string;
  source: MovementSource;
  proposalId?: string;
};

const managerOnlyTypes = new Set<MovementType>([MovementType.ADJUSTMENT_IN, MovementType.ADJUSTMENT_OUT]);

function validateMovementPolicy(input: CreateMovementInput) {
  if (managerOnlyTypes.has(input.type) && input.actorRole !== "MANAGER") {
    throw new AppError(403, "FORBIDDEN", "Only a manager can record manual adjustments.");
  }
  if (managerOnlyTypes.has(input.type) && !input.reason?.trim()) {
    throw new AppError(400, "VALIDATION_FAILED", "A reason is required for a manual adjustment.");
  }
}

export async function createMovement(input: CreateMovementInput) {
  validateMovementPolicy(input);
  const delta = movementDelta(input.type, input.quantity);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: input.productId } });
        if (!product?.isActive) throw new AppError(404, "NOT_FOUND", "Active product not found.");

        if (input.supplierId) {
          const supplier = await tx.supplier.findUnique({ where: { id: input.supplierId } });
          if (!supplier?.isActive) throw new AppError(404, "NOT_FOUND", "Active supplier not found.");
        }

        const nextQuantity = product.quantity + delta;
        if (nextQuantity < 0) {
          throw new AppError(409, "INSUFFICIENT_STOCK", `Only ${product.quantity} units are available.`, {
            available: product.quantity,
            requested: input.quantity,
          });
        }

        const updated = await tx.product.update({
          where: { id: product.id },
          data: { quantity: nextQuantity, version: { increment: 1 } },
        });
        const movement = await tx.stockMovement.create({
          data: {
            productId: product.id,
            actorUserId: input.actorUserId,
            supplierId: input.supplierId,
            proposalId: input.proposalId,
            type: input.type,
            source: input.source,
            quantity: input.quantity,
            delta,
            beforeQuantity: product.quantity,
            afterQuantity: nextQuantity,
            reason: input.reason?.trim() || undefined,
          },
          include: { product: { select: { id: true, sku: true, name: true } }, actor: { select: { id: true, name: true } }, supplier: { select: { id: true, name: true } } },
        });
        return { movement, product: updated };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < 3) continue;
      throw error;
    }
  }

  throw new AppError(409, "CONCURRENT_UPDATE", "Inventory changed concurrently. Please try again.");
}

