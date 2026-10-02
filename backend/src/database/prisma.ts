import { PrismaClient } from "@prisma/client";
import "../config/env.js";

const globalForPrisma = globalThis as unknown as { stocksensePrisma?: PrismaClient };

export const prisma = globalForPrisma.stocksensePrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.stocksensePrisma = prisma;
}

