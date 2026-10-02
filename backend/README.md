# Backend Component Contract

## Purpose

This directory will contain the authoritative API and business-logic application.

## Owned responsibilities

- Authentication and secure role derivation
- Route and field-level authorization
- Request validation and normalized error responses
- Product and supplier services
- Inventory movements and negative-stock prevention
- Atomic stock/history transactions
- Dashboard and reporting calculations
- Audit metadata and identifiers
- Pending AI proposal lifecycle and idempotent confirmation
- Public chat gateway and protected n8n tool endpoints
- n8n timeout/error normalization

## Core service-reuse rule

Normal forms and AI confirmation call the same inventory service. Dashboard endpoints and AI reporting tools call the same reporting service. No n8n workflow may reimplement authoritative inventory arithmetic.

## Internal agent gateway

Backend-to-n8n calls will carry a signed, minimal user context. n8n-to-backend tool calls will use separate service authentication, validate the referenced user/request context, and expose only allow-listed operations. The final mechanism will be specified in Phase 2.

## Current implementation

Phase 5 implemented authentication, role-aware products, reference data, atomic inventory movements, history, operational summaries, top-selling reports, and manager-only financial reporting. Phase 7 added the public chat gateway and secure read tools. Phase 8 adds persisted proposal preparation, owner-only retrieval/cancellation, and atomic exactly-once confirmation through the same inventory rules.

## Implemented modules

- `auth/`: Argon2 login, signed HttpOnly session cookie, active-user reload, and role middleware
- `products/`: role-filtered serialization plus manager create/update operations
- `inventory/`: pure movement policy, serializable transactions, negative-stock protection, and history
- `reports/`: low-stock, top-selling, and manager-only financial summaries
- `reference/`: authenticated categories and suppliers
- `http/`: request identifiers, typed errors, async routing, and normalized error responses
- `database/`: shared Prisma client lifecycle
- `agent/`: gateway contracts, signed user context, service authentication, public chat routes, and allow-listed internal tools
- `proposals/`: proposal preparation, ownership, expiry, cancellation, locking, confirmation, audit, and idempotent result recovery

## Verified Phase 5 behavior

- Unauthenticated products request returns 401.
- Staff product results omit cost and margin.
- Direct staff price update returns 403.
- Sale of 8 with only 5 available returns 409 and leaves stock at 5.
- Reversible form movements changed Type-C Cable 15 → 16 → 15 and created two history records.
- Manager responses include cost fields and can access financial reports.
- Nine unit tests pass, and the backend type-checks and builds.

## Verified Phase 7 behavior

- A manager can call low-stock, product-stock, top-selling, and financial read tools through signed internal context.
- Staff financial-tool access is rejected with `403 FORBIDDEN` by the backend.
- n8n has no database connection and receives only allow-listed tool results.
- Chat reaches the published n8n workflow and maps the provider's current credit failure to a stable `unavailable` response.
- No Phase 7 agent route can create or apply an inventory movement.

## Phase 9 hardening

- Unsafe browser writes require a trusted Origin and reject cross-site fetch metadata.
- Login, chat, and proposal APIs use bounded in-memory abuse throttles with standard rate-limit headers.
- Internal tools re-read active-user status and current role instead of relying only on signed context claims.
- Request IDs accept only log-safe characters; malformed JSON and oversized bodies receive stable typed errors.
- Unexpected failures log request ID plus sanitized category, never raw error objects or request secrets.

