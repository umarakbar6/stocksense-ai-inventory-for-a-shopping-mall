import { MovementType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { movementDelta } from "./inventory-policy.js";

describe("movementDelta", () => {
  it.each([
    [MovementType.STOCK_IN, 40, 40],
    [MovementType.ADJUSTMENT_IN, 3, 3],
    [MovementType.SALE, 8, -8],
    [MovementType.DAMAGED, 2, -2],
    [MovementType.ADJUSTMENT_OUT, 1, -1],
  ])("maps %s quantity %i to signed delta %i", (type, quantity, expected) => {
    expect(movementDelta(type, quantity)).toBe(expected);
  });
});

