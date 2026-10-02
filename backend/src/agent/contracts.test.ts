import { describe, expect, it } from "vitest";
import { agentResponseSchema, chatRequestSchema } from "./contracts.js";

describe("agent contracts", () => {
  it("accepts and trims a bounded chat message", () => {
    expect(chatRequestSchema.parse({ message: "  Which products are low?  " }).message).toBe("Which products are low?");
  });

  it("rejects mutation-like response kinds", () => {
    expect(agentResponseSchema.safeParse({ version: "1.0", requestId: "req-1", conversationId: "824a3f15-d7f5-44e8-8cd5-a29d89438e1e", kind: "mutation", message: "done", citationsToToolResults: [] }).success).toBe(false);
  });

  it("accepts a structured pending proposal but rejects a proposal envelope without its card data", () => {
    const base = { version: "1.0", requestId: "req-8", conversationId: "824a3f15-d7f5-44e8-8cd5-a29d89438e1e", kind: "proposal", message: "Review this change.", citationsToToolResults: ["tool-8"] } as const;
    expect(agentResponseSchema.safeParse(base).success).toBe(false);
    expect(agentResponseSchema.safeParse({ ...base, proposal: { id: "5f0cd0d8-9f54-4637-8f79-f6c557558dec", status: "PENDING", movementType: "STOCK_IN", quantity: 40, reason: null, beforeQuantity: 15, projectedQuantity: 55, expiresAt: new Date().toISOString(), createdAt: new Date().toISOString(), product: { id: "f3110dd6-19c6-4902-8a53-b89cf343a012", sku: "ELEC-TYPEC-001", name: "Type-C Cable" }, supplier: null, executedMovement: null } }).success).toBe(true);
  });
});
