import { MovementType, type Role } from "@prisma/client";
import { prisma } from "../database/prisma.js";
import { serializeProduct } from "../products/product-serializer.js";

export async function getLowStock(role: Role) {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: [{ quantity: "asc" }, { name: "asc" }],
  });
  return products
    .filter((product) => product.quantity <= product.lowStockThreshold)
    .map((product) => serializeProduct(product, role));
}

export async function getTopSelling(from: Date, to: Date, limit: number) {
  const groups = await prisma.stockMovement.groupBy({
    by: ["productId"],
    where: { type: MovementType.SALE, occurredAt: { gte: from, lte: to } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
  const products = await prisma.product.findMany({
    where: { id: { in: groups.map((group) => group.productId) } },
    select: { id: true, sku: true, name: true },
  });
  const productById = new Map(products.map((product) => [product.id, product]));
  return groups
    .map((group) => ({ product: productById.get(group.productId), unitsSold: group._sum.quantity ?? 0 }))
    .filter((item): item is { product: { id: string; sku: string; name: string }; unitsSold: number } => Boolean(item.product));
}

export async function getFinancialSummary(from: Date, to: Date) {
  const sales = await prisma.stockMovement.findMany({
    where: { type: MovementType.SALE, occurredAt: { gte: from, lte: to } },
    include: { product: { select: { sellingPriceMinor: true, costPriceMinor: true } } },
  });
  const result = sales.reduce((summary, sale) => {
    summary.unitsSold += sale.quantity;
    summary.revenueMinor += sale.quantity * sale.product.sellingPriceMinor;
    summary.costMinor += sale.quantity * sale.product.costPriceMinor;
    return summary;
  }, { unitsSold: 0, revenueMinor: 0, costMinor: 0 });
  return { ...result, profitMinor: result.revenueMinor - result.costMinor };
}
