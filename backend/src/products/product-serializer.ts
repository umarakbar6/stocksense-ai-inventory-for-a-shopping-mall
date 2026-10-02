import type { Prisma, Role } from "@prisma/client";

type ProductWithCategory = Prisma.ProductGetPayload<{ include: { category: true } }>;

export function serializeProduct(product: ProductWithCategory, role: Role) {
  const common = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    category: { id: product.category.id, name: product.category.name },
    quantity: product.quantity,
    lowStockThreshold: product.lowStockThreshold,
    sellingPriceMinor: product.sellingPriceMinor,
    isLowStock: product.quantity <= product.lowStockThreshold,
    isActive: product.isActive,
    version: product.version,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };

  if (role === "MANAGER") {
    return {
      ...common,
      costPriceMinor: product.costPriceMinor,
      unitMarginMinor: product.sellingPriceMinor - product.costPriceMinor,
    };
  }

  return common;
}

