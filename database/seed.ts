import "dotenv/config";
import argon2 from "argon2";
import { MovementSource, MovementType, PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();
const demoPassword = process.env.SEED_DEMO_PASSWORD ?? "StockSense-Demo-2026!";

type SeedProduct = {
  sku: string;
  name: string;
  category: "Grocery" | "Clothing" | "Electronics" | "Household";
  quantity: number;
  lowStockThreshold: number;
  sellingPriceMinor: number;
  costPriceMinor: number;
};

const products: SeedProduct[] = [
  { sku: "ELEC-TYPEC-001", name: "Type-C Cable", category: "Electronics", quantity: 15, lowStockThreshold: 10, sellingPriceMinor: 129_900, costPriceMinor: 85_000 },
  { sku: "GROC-RICE-005", name: "Basmati Rice 5kg", category: "Grocery", quantity: 32, lowStockThreshold: 8, sellingPriceMinor: 245_000, costPriceMinor: 210_000 },
  { sku: "CLTH-TSHIRT-001", name: "Classic Cotton T-Shirt", category: "Clothing", quantity: 5, lowStockThreshold: 6, sellingPriceMinor: 189_900, costPriceMinor: 110_000 },
  { sku: "HOME-CLEAN-001", name: "Floor Cleaner 1L", category: "Household", quantity: 24, lowStockThreshold: 5, sellingPriceMinor: 47_500, costPriceMinor: 33_000 },
];

async function seedUsers(passwordHash: string) {
  const manager = await prisma.user.upsert({
    where: { email: "manager@stocksense.local" },
    update: { name: "Mall Manager", role: Role.MANAGER, isActive: true, passwordHash },
    create: { name: "Mall Manager", email: "manager@stocksense.local", role: Role.MANAGER, passwordHash },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@stocksense.local" },
    update: { name: "Inventory Staff", role: Role.STAFF, isActive: true, passwordHash },
    create: { name: "Inventory Staff", email: "staff@stocksense.local", role: Role.STAFF, passwordHash },
  });

  return { manager, staff };
}

async function seedCategories() {
  const categoryIds = new Map<string, string>();
  for (const name of ["Grocery", "Clothing", "Electronics", "Household"]) {
    const category = await prisma.category.upsert({
      where: { name },
      update: { description: `${name} inventory section` },
      create: { name, description: `${name} inventory section` },
    });
    categoryIds.set(name, category.id);
  }
  return categoryIds;
}

async function seedProducts(managerId: string, supplierId: string, categoryIds: Map<string, string>) {
  for (const item of products) {
    const categoryId = categoryIds.get(item.category);
    if (!categoryId) throw new Error(`Seed category not found: ${item.category}`);

    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        categoryId,
        lowStockThreshold: item.lowStockThreshold,
        sellingPriceMinor: item.sellingPriceMinor,
        costPriceMinor: item.costPriceMinor,
        isActive: true,
      },
      create: {
        sku: item.sku,
        name: item.name,
        categoryId,
        quantity: item.quantity,
        lowStockThreshold: item.lowStockThreshold,
        sellingPriceMinor: item.sellingPriceMinor,
        costPriceMinor: item.costPriceMinor,
      },
    });

    const reason = `Seed opening balance: ${item.sku}`;
    const openingMovement = await prisma.stockMovement.findFirst({ where: { productId: product.id, reason } });
    if (!openingMovement && product.quantity > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          actorUserId: managerId,
          supplierId,
          type: MovementType.STOCK_IN,
          source: MovementSource.FORM,
          quantity: product.quantity,
          delta: product.quantity,
          beforeQuantity: 0,
          afterQuantity: product.quantity,
          reason,
        },
      });
    }
  }
}

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Demo seed is disabled in production.");

  const passwordHash = await argon2.hash(demoPassword, { type: argon2.argon2id });
  const { manager, staff } = await seedUsers(passwordHash);
  const categoryIds = await seedCategories();
  const supplier = await prisma.supplier.upsert({
    where: { name: "Ali Traders" },
    update: { isActive: true },
    create: { name: "Ali Traders", phone: "+92-300-0000000" },
  });

  await seedProducts(manager.id, supplier.id, categoryIds);
  console.info(`Seed complete: ${manager.email}, ${staff.email}, ${products.length} products, supplier ${supplier.name}.`);
}

main()
  .catch((error) => {
    console.error("Database seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

