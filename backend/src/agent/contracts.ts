import { z } from "zod";

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(2_000),
  conversationId: z.string().uuid().optional(),
});

export const agentResponseSchema = z.object({
  version: z.literal("1.0"),
  requestId: z.string().min(1),
  conversationId: z.string().uuid(),
  kind: z.enum(["answer", "proposal", "refusal", "unavailable"]),
  message: z.string().min(1).max(4_000),
  citationsToToolResults: z.array(z.string().min(1)).max(10).default([]),
  meta: z.object({ intent: z.string().min(1), tool: z.string().nullable() }).optional(),
  proposal: z.object({
    id: z.string().uuid(),
    status: z.enum(["PENDING", "CANCELLED", "EXECUTED", "EXPIRED", "REJECTED"]),
    movementType: z.enum(["STOCK_IN", "SALE", "DAMAGED", "ADJUSTMENT_IN", "ADJUSTMENT_OUT"]),
    quantity: z.number().int().positive(),
    reason: z.string().nullable(),
    beforeQuantity: z.number().int().nonnegative(),
    projectedQuantity: z.number().int().nonnegative(),
    expiresAt: z.coerce.date(),
    createdAt: z.coerce.date(),
    product: z.object({ id: z.string().uuid(), sku: z.string(), name: z.string() }),
    supplier: z.object({ id: z.string().uuid(), name: z.string() }).nullable(),
    executedMovement: z.object({ id: z.string().uuid(), beforeQuantity: z.number().int(), afterQuantity: z.number().int(), delta: z.number().int(), occurredAt: z.coerce.date() }).nullable(),
  }).optional(),
}).refine((value) => value.kind !== "proposal" || Boolean(value.proposal), { message: "Proposal responses require proposal data." });

export type AgentResponse = z.infer<typeof agentResponseSchema>;
