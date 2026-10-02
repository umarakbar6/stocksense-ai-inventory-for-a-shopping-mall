import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { serializeProduct } from "./product-serializer.js";

const product = {
  id: "11111111-1111-4111-8111-111111111111",
  sku: "ELEC-TYPEC-001",
  name: "Type-C Cable",
  description: null,
  categoryId: "22222222-2222-4222-8222-222222222222",
  quantity: 15,
  lowStockThreshold: 10,
  sellingPriceMinor: 129_900,
  costPriceMinor: 85_000,
  isActive: true,
  version: 1,
  createdAt: new Date("2026-09-30T00:00:00Z"),
  updatedAt: new Date("2026-09-30T00:00:00Z"),
  category: { id: "22222222-2222-4222-8222-222222222222", name: "Electronics", description: null, createdAt: new Date(), updatedAt: new Date() },
};

describe("serializeProduct", () => {
  it("omits cost and margin for staff", () => {
    const result = serializeProduct(product, Role.STAFF);
    expect(result).not.toHaveProperty("costPriceMinor");
    expect(result).not.toHaveProperty("unitMarginMinor");
    expect(result).toMatchObject({ sku: "ELEC-TYPEC-001", quantity: 15, sellingPriceMinor: 129_900 });
  });

  it("includes cost and derived margin for managers", () => {
    const result = serializeProduct(product, Role.MANAGER);
    expect(result).toMatchObject({ costPriceMinor: 85_000, unitMarginMinor: 44_900 });
  });
});

