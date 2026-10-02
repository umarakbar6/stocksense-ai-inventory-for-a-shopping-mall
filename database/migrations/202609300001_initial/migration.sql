-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('STOCK_IN', 'SALE', 'DAMAGED', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT');

-- CreateEnum
CREATE TYPE "MovementSource" AS ENUM ('FORM', 'AI');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'CANCELLED', 'EXECUTED', 'EXPIRED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "sku" VARCHAR(64) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" VARCHAR(1000),
    "category_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 5,
    "selling_price_minor" INTEGER NOT NULL,
    "cost_price_minor" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "phone" VARCHAR(40),
    "email" VARCHAR(254),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "supplier_id" UUID,
    "proposal_id" UUID,
    "type" "MovementType" NOT NULL,
    "source" "MovementSource" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "before_quantity" INTEGER NOT NULL,
    "after_quantity" INTEGER NOT NULL,
    "reason" VARCHAR(500),
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_proposals" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "supplier_id" UUID,
    "movement_type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" VARCHAR(500),
    "before_quantity" INTEGER NOT NULL,
    "projected_quantity" INTEGER NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "idempotency_key" VARCHAR(160) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "executed_movement_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" UUID NOT NULL,
    "request_id" VARCHAR(128) NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_category_id_is_active_idx" ON "products"("category_id", "is_active");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movements_proposal_id_key" ON "stock_movements"("proposal_id");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_occurred_at_idx" ON "stock_movements"("product_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "stock_movements_type_occurred_at_idx" ON "stock_movements"("type", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "stock_movements_actor_user_id_occurred_at_idx" ON "stock_movements"("actor_user_id", "occurred_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ai_proposals_idempotency_key_key" ON "ai_proposals"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "ai_proposals_executed_movement_id_key" ON "ai_proposals"("executed_movement_id");

-- CreateIndex
CREATE INDEX "ai_proposals_actor_user_id_status_idx" ON "ai_proposals"("actor_user_id", "status");

-- CreateIndex
CREATE INDEX "ai_proposals_status_expires_at_idx" ON "ai_proposals"("status", "expires_at");

-- CreateIndex
CREATE INDEX "audit_events_entity_type_entity_id_idx" ON "audit_events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_events_actor_user_id_created_at_idx" ON "audit_events"("actor_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_events_request_id_idx" ON "audit_events"("request_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "ai_proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_proposals" ADD CONSTRAINT "ai_proposals_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_proposals" ADD CONSTRAINT "ai_proposals_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_proposals" ADD CONSTRAINT "ai_proposals_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Domain constraints Prisma cannot currently express in schema.prisma.
ALTER TABLE "products"
  ADD CONSTRAINT "products_quantity_nonnegative" CHECK ("quantity" >= 0),
  ADD CONSTRAINT "products_threshold_nonnegative" CHECK ("low_stock_threshold" >= 0),
  ADD CONSTRAINT "products_selling_price_nonnegative" CHECK ("selling_price_minor" >= 0),
  ADD CONSTRAINT "products_cost_price_nonnegative" CHECK ("cost_price_minor" >= 0),
  ADD CONSTRAINT "products_version_positive" CHECK ("version" > 0);

ALTER TABLE "stock_movements"
  ADD CONSTRAINT "movements_quantity_positive" CHECK ("quantity" > 0),
  ADD CONSTRAINT "movements_delta_nonzero" CHECK ("delta" <> 0),
  ADD CONSTRAINT "movements_before_nonnegative" CHECK ("before_quantity" >= 0),
  ADD CONSTRAINT "movements_after_nonnegative" CHECK ("after_quantity" >= 0),
  ADD CONSTRAINT "movements_delta_matches_quantity" CHECK (ABS("delta") = "quantity"),
  ADD CONSTRAINT "movements_balances_match" CHECK ("after_quantity" = "before_quantity" + "delta");

ALTER TABLE "ai_proposals"
  ADD CONSTRAINT "proposals_quantity_positive" CHECK ("quantity" > 0),
  ADD CONSTRAINT "proposals_before_nonnegative" CHECK ("before_quantity" >= 0),
  ADD CONSTRAINT "proposals_projected_nonnegative" CHECK ("projected_quantity" >= 0);
