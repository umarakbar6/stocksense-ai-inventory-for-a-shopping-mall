import { MovementType } from "@prisma/client";

const positiveTypes = new Set<MovementType>([MovementType.STOCK_IN, MovementType.ADJUSTMENT_IN]);

export function movementDelta(type: MovementType, quantity: number) {
  return positiveTypes.has(type) ? quantity : -quantity;
}

