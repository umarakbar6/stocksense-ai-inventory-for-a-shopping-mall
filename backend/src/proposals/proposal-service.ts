import { MovementSource, MovementType, Prisma, ProposalStatus, Role } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "../database/prisma.js";
import { AppError } from "../http/app-error.js";
import { movementDelta } from "../inventory/inventory-policy.js";

const managerOnlyTypes = new Set<MovementType>([MovementType.ADJUSTMENT_IN, MovementType.ADJUSTMENT_OUT]);
const proposalInclude = {
  product: { select: { id: true, sku: true, name: true } },
  supplier: { select: { id: true, name: true } },
  executedMovement: { select: { id: true, beforeQuantity: true, afterQuantity: true, delta: true, occurredAt: true } },
} satisfies Prisma.AiProposalInclude;

export type PrepareProposalInput = {
  actorUserId: string;
  actorRole: Role;
  productId: string;
  supplierId?: string;
  movementType: MovementType;
  quantity: number;
  reason?: string;
  idempotencyKey: string;
};

export function serializeProposal(proposal: Prisma.AiProposalGetPayload<{ include: typeof proposalInclude }>) {
  return {
    id: proposal.id,
    status: proposal.status,
    movementType: proposal.movementType,
    quantity: proposal.quantity,
    reason: proposal.reason,
    beforeQuantity: proposal.beforeQuantity,
    projectedQuantity: proposal.projectedQuantity,
    expiresAt: proposal.expiresAt,
    createdAt: proposal.createdAt,
    product: proposal.product,
    supplier: proposal.supplier,
    executedMovement: proposal.executedMovement,
  };
}

function validatePolicy(role: Role, type: MovementType, reason?: string) {
  if (managerOnlyTypes.has(type) && role !== Role.MANAGER) throw new AppError(403, "FORBIDDEN", "Only a manager can prepare an inventory adjustment.");
  if (managerOnlyTypes.has(type) && !reason?.trim()) throw new AppError(400, "VALIDATION_FAILED", "A reason is required for an inventory adjustment.");
}

export async function prepareProposal(input: PrepareProposalInput) {
  validatePolicy(input.actorRole, input.movementType, input.reason);
  const existing = await prisma.aiProposal.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: proposalInclude });
  if (existing) {
    if (existing.actorUserId !== input.actorUserId) throw new AppError(409, "DUPLICATE_REQUEST", "That proposal request has already been used.");
    return serializeProposal(existing);
  }

  const [product, supplier] = await Promise.all([
    prisma.product.findUnique({ where: { id: input.productId } }),
    input.supplierId ? prisma.supplier.findUnique({ where: { id: input.supplierId } }) : Promise.resolve(null),
  ]);
  if (!product?.isActive) throw new AppError(404, "NOT_FOUND", "Active product not found.");
  if (input.supplierId && !supplier?.isActive) throw new AppError(404, "NOT_FOUND", "Active supplier not found.");

  const projectedQuantity = product.quantity + movementDelta(input.movementType, input.quantity);
  if (projectedQuantity < 0) throw new AppError(409, "INSUFFICIENT_STOCK", `Only ${product.quantity} units are available.`, { available: product.quantity, requested: input.quantity });

  const proposal = await prisma.aiProposal.create({
    data: {
      actorUserId: input.actorUserId,
      productId: product.id,
      supplierId: input.supplierId,
      movementType: input.movementType,
      quantity: input.quantity,
      reason: input.reason?.trim() || undefined,
      beforeQuantity: product.quantity,
      projectedQuantity,
      idempotencyKey: input.idempotencyKey,
      expiresAt: new Date(Date.now() + 15 * 60_000),
    },
    include: proposalInclude,
  });
  return serializeProposal(proposal);
}

export async function getOwnedProposal(id: string, actorUserId: string) {
  const proposal = await prisma.aiProposal.findUnique({ where: { id }, include: proposalInclude });
  if (!proposal || proposal.actorUserId !== actorUserId) throw new AppError(404, "NOT_FOUND", "Proposal not found.");
  if (proposal.status === ProposalStatus.PENDING && proposal.expiresAt <= new Date()) {
    const expired = await prisma.aiProposal.update({ where: { id }, data: { status: ProposalStatus.EXPIRED }, include: proposalInclude });
    return serializeProposal(expired);
  }
  return serializeProposal(proposal);
}

export async function cancelProposal(id: string, actorUserId: string) {
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM ai_proposals WHERE id = ${id}::uuid FOR UPDATE`;
    const proposal = await tx.aiProposal.findUnique({ where: { id }, include: proposalInclude });
    if (!proposal || proposal.actorUserId !== actorUserId) throw new AppError(404, "NOT_FOUND", "Proposal not found.");
    if (proposal.status === ProposalStatus.CANCELLED) return serializeProposal(proposal);
    if (proposal.status !== ProposalStatus.PENDING) throw new AppError(409, "PROPOSAL_NOT_PENDING", `This proposal is already ${proposal.status.toLowerCase()}.`);
    if (proposal.expiresAt <= new Date()) {
      await tx.aiProposal.update({ where: { id }, data: { status: ProposalStatus.EXPIRED } });
      return { expired: true as const };
    }
    return serializeProposal(await tx.aiProposal.update({ where: { id }, data: { status: ProposalStatus.CANCELLED }, include: proposalInclude }));
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  if ("expired" in result) throw new AppError(409, "PROPOSAL_EXPIRED", "This proposal has expired. Please ask the assistant to prepare a new one.");
  return result;
}

export async function confirmProposal(id: string, actorUserId: string, actorRole: Role, requestId: string) {
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM ai_proposals WHERE id = ${id}::uuid FOR UPDATE`;
    const proposal = await tx.aiProposal.findUnique({ where: { id }, include: proposalInclude });
    if (!proposal || proposal.actorUserId !== actorUserId) throw new AppError(404, "NOT_FOUND", "Proposal not found.");
    if (proposal.status === ProposalStatus.EXECUTED && proposal.executedMovement) return { proposal: serializeProposal(proposal), movement: proposal.executedMovement, idempotent: true };
    if (proposal.status !== ProposalStatus.PENDING) throw new AppError(409, "PROPOSAL_NOT_PENDING", `This proposal is already ${proposal.status.toLowerCase()}.`);
    if (proposal.expiresAt <= new Date()) {
      await tx.aiProposal.update({ where: { id }, data: { status: ProposalStatus.EXPIRED } });
      return { expired: true as const };
    }
    validatePolicy(actorRole, proposal.movementType, proposal.reason ?? undefined);
    await tx.$queryRaw`SELECT id FROM products WHERE id = ${proposal.productId}::uuid FOR UPDATE`;
    const product = await tx.product.findUnique({ where: { id: proposal.productId } });
    if (!product?.isActive) throw new AppError(404, "NOT_FOUND", "Active product not found.");
    const delta = movementDelta(proposal.movementType, proposal.quantity);
    const afterQuantity = product.quantity + delta;
    if (afterQuantity < 0) throw new AppError(409, "INSUFFICIENT_STOCK", `Only ${product.quantity} units are available.`, { available: product.quantity, requested: proposal.quantity });

    await tx.product.update({ where: { id: product.id }, data: { quantity: afterQuantity, version: { increment: 1 } } });
    const movement = await tx.stockMovement.create({
      data: { productId: product.id, actorUserId, supplierId: proposal.supplierId, proposalId: proposal.id, type: proposal.movementType, source: MovementSource.AI, quantity: proposal.quantity, delta, beforeQuantity: product.quantity, afterQuantity, reason: proposal.reason },
      select: { id: true, beforeQuantity: true, afterQuantity: true, delta: true, occurredAt: true },
    });
    const executed = await tx.aiProposal.update({ where: { id }, data: { status: ProposalStatus.EXECUTED, executedMovementId: movement.id }, include: proposalInclude });
    await tx.auditEvent.create({ data: { id: randomUUID(), actorUserId, action: "AI_PROPOSAL_CONFIRMED", entityType: "AiProposal", entityId: proposal.id, requestId, metadata: { movementId: movement.id, productId: product.id } } });
    return { proposal: serializeProposal(executed), movement, idempotent: false };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  if ("expired" in result) throw new AppError(409, "PROPOSAL_EXPIRED", "This proposal has expired. Please ask the assistant to prepare a new one.");
  return result;
}
