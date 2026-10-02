export type Role = "MANAGER" | "STAFF";
export type User = { id: string; name: string; email: string; role: Role };
export type Category = { id: string; name: string; description?: string | null };
export type Supplier = { id: string; name: string; phone?: string | null; email?: string | null };
export type Product = { id: string; sku: string; name: string; description?: string | null; category: Category; quantity: number; lowStockThreshold: number; sellingPriceMinor: number; costPriceMinor?: number; unitMarginMinor?: number; isLowStock: boolean; isActive: boolean; version: number; createdAt: string; updatedAt: string };
export type MovementType = "STOCK_IN" | "SALE" | "DAMAGED" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";
export type Movement = { id: string; type: MovementType; source: "FORM" | "AI"; quantity: number; delta: number; beforeQuantity: number; afterQuantity: number; reason?: string | null; occurredAt: string; product: Pick<Product, "id" | "sku" | "name">; actor: Pick<User, "id" | "name">; supplier?: Pick<Supplier, "id" | "name"> | null };
