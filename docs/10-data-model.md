# Phase 2 — Relational Data Model

## Entity relationship overview

```text
User 1 ─── * StockMovement * ─── 1 Product * ─── 1 Category
  │                 │                │
  │                 └── 0..1 Supplier
  │
  ├── * AiProposal * ─── 1 Product
  │          │
  │          └── 0..1 StockMovement
  │
  └── * AuditEvent
```

## User

| Field | Type | Rule |
|---|---|---|
| id | UUID | Primary key |
| name | text | Required |
| email | text | Required, normalized, unique |
| passwordHash | text | Required, never returned |
| role | enum | `MANAGER` or `STAFF` |
| isActive | boolean | Defaults true |
| createdAt / updatedAt | timestamptz | Backend managed |

## Category

| Field | Type | Rule |
|---|---|---|
| id | UUID | Primary key |
| name | text | Required, case-insensitive unique |
| description | text nullable | Optional |
| createdAt / updatedAt | timestamptz | Backend managed |

Initial seed categories are Grocery, Clothing, Electronics, and Household.

## Product

| Field | Type | Rule |
|---|---|---|
| id | UUID | Primary key |
| sku | text | Required, normalized, unique |
| name | text | Required and searchable |
| description | text nullable | Optional |
| categoryId | UUID | Required foreign key |
| quantity | integer | Required, check `quantity >= 0` |
| lowStockThreshold | integer | Required, check `>= 0` |
| sellingPriceMinor | integer | Required, check `>= 0` |
| costPriceMinor | integer | Required, check `>= 0`, manager-only |
| isActive | boolean | Defaults true |
| version | integer | Incremented on writes for optimistic visibility |
| createdAt / updatedAt | timestamptz | Backend managed |

Money is stored in minor currency units, avoiding floating-point errors. Currency defaults to PKR at application configuration level.

## Supplier

| Field | Type | Rule |
|---|---|---|
| id | UUID | Primary key |
| name | text | Required, case-insensitive unique |
| phone / email | text nullable | Optional contact information |
| isActive | boolean | Defaults true |
| createdAt / updatedAt | timestamptz | Backend managed |

## StockMovement

| Field | Type | Rule |
|---|---|---|
| id | UUID | Primary key |
| productId | UUID | Required foreign key |
| actorUserId | UUID | Required foreign key |
| supplierId | UUID nullable | Optional foreign key |
| proposalId | UUID nullable | Unique when present |
| type | enum | `STOCK_IN`, `SALE`, `DAMAGED`, `ADJUSTMENT_IN`, `ADJUSTMENT_OUT` |
| source | enum | `FORM` or `AI` |
| quantity | integer | Positive absolute quantity |
| delta | integer | Signed quantity applied to stock |
| beforeQuantity | integer | Non-negative snapshot |
| afterQuantity | integer | Non-negative snapshot |
| reason | text nullable | Required for manual adjustments |
| occurredAt | timestamptz | Business event time, backend assigned |
| createdAt | timestamptz | Persistence time |

Successful sale totals sum `quantity` where `type = SALE`. Failed attempts never create this record.

## AiProposal

| Field | Type | Rule |
|---|---|---|
| id | UUID | Primary key |
| actorUserId | UUID | Required owner |
| productId | UUID | Required foreign key |
| supplierId | UUID nullable | Optional foreign key |
| movementType | enum | A movement type permitted for the actor |
| quantity | integer | Positive normalized value |
| reason | text nullable | Normalized reason |
| beforeQuantity | integer | Informational snapshot shown to user |
| projectedQuantity | integer | Informational snapshot shown to user |
| status | enum | `PENDING`, `CANCELLED`, `EXECUTED`, `EXPIRED`, `REJECTED` |
| idempotencyKey | text | Required, unique |
| expiresAt | timestamptz | Required |
| executedMovementId | UUID nullable | Unique link after execution |
| createdAt / updatedAt | timestamptz | Backend managed |

The confirmation transaction locks the proposal and product rows, rechecks current quantity, creates a movement, and marks the proposal executed. Stored snapshots are never trusted as current truth during confirmation.

## AuditEvent

| Field | Type | Rule |
|---|---|---|
| id | UUID | Primary key |
| actorUserId | UUID nullable | Nullable only for controlled system actions |
| action | text | Stable action code such as `PRODUCT_PRICE_UPDATED` |
| entityType / entityId | text / UUID | Target reference |
| requestId | text | Trace correlation |
| metadata | JSONB | Sanitized before/after or context; no secrets |
| createdAt | timestamptz | Immutable event time |

## Required indexes

- Product: unique SKU; case-insensitive name search; category and active status
- StockMovement: product plus occurred time; type plus occurred time; actor plus occurred time
- AiProposal: actor plus status; status plus expiry; unique idempotency key
- AuditEvent: entity reference; actor; created time; request ID

## Time rules

Timestamps are stored as UTC `timestamptz`. Reporting boundaries are calculated for `Asia/Karachi`. “This week” begins Monday 00:00 local time and ends at the request time unless an explicit full-week interval is requested.

