# Phase 2 — API Contract

All responses use JSON. Successful responses use `{ "data": ... }`. Errors use `{ "error": { "code", "message", "requestId", "details?" } }`. The backend sets a request ID on every response.

## Authentication

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Public | Validate credentials and set HttpOnly auth cookie |
| POST | `/api/v1/auth/logout` | Authenticated | Clear auth cookie |
| GET | `/api/v1/auth/me` | Authenticated | Return safe current-user profile |

## Products

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/api/v1/products` | Both | Search/filter/paginate role-filtered products |
| GET | `/api/v1/products/:id` | Both | Return one role-filtered product |
| POST | `/api/v1/products` | Manager | Create product |
| PATCH | `/api/v1/products/:id` | Manager | Update product, including controlled price changes |

Staff product representations omit `costPriceMinor`, margin, and profit fields.

## Inventory and history

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/api/v1/inventory/movements` | Both, policy-scoped | Create form-origin movement |
| GET | `/api/v1/inventory/movements` | Both | Filtered movement history |
| GET | `/api/v1/inventory/summary` | Both | Operational counts and low-stock data |

Movement request fields are `productId`, `type`, `quantity`, optional `supplierId`, and optional `reason`. Actor, source, before/after quantities, timestamps, and delta are server-derived.

## Reports

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/api/v1/reports/top-selling?from=&to=&limit=` | Both | Ranked sales quantities |
| GET | `/api/v1/reports/low-stock` | Both | Products at or below thresholds |
| GET | `/api/v1/reports/financial-summary?from=&to=` | Manager | Cost, revenue, and derived profit data |

## Chat and proposals

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/api/v1/chat/messages` | Both | Send one message through the backend agent gateway |
| POST | `/api/v1/ai-proposals/:id/confirm` | Owner with current permission | Execute pending proposal exactly once |
| POST | `/api/v1/ai-proposals/:id/cancel` | Owner | Cancel pending proposal |
| GET | `/api/v1/ai-proposals/:id` | Owner | Retrieve proposal state for refresh recovery |

The chat response envelope has `kind` equal to `answer`, `proposal`, `refusal`, or `unavailable`. A `proposal` contains its ID and display fields but never grants authority to execute itself.

## Internal n8n tool endpoints

Internal routes use `/internal/v1/agent-tools/*`, require service authentication, and require a signed user-context reference issued for the chat request.

| Tool endpoint | Allowed role | Result |
|---|---|---|
| `POST /search-products` | Both | Role-filtered product matches |
| `POST /stock-levels` | Both | Current quantities for resolved products |
| `POST /low-stock` | Both | Low-stock result from reporting service |
| `POST /top-selling` | Both | Ranked sales result from reporting service |
| `POST /financial-summary` | Manager | Manager-only financial result |
| `POST /prepare-movement` | Both, policy-scoped | Persisted pending proposal or typed rejection |

There is deliberately no internal “execute movement” AI tool.

## Stable error codes

- `AUTH_REQUIRED` → 401
- `FORBIDDEN` → 403
- `VALIDATION_FAILED` → 400
- `NOT_FOUND` → 404
- `INSUFFICIENT_STOCK` → 409
- `PROPOSAL_NOT_PENDING` → 409
- `PROPOSAL_EXPIRED` → 409
- `DUPLICATE_REQUEST` → 409 or idempotent prior result
- `AGENT_UNAVAILABLE` → 503 for chat only
- `INTERNAL_ERROR` → 500 with safe public message

