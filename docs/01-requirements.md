# Phase 0 — Requirements Specification

## 1. Product objective

Build one responsive inventory web application for Nowshera Shopping Mall. Managers and staff use conventional pages and forms, while an embedded AI assistant answers permitted questions from real inventory data and prepares safe stock changes for human confirmation.

## 2. Business problems

| ID | Problem | Required system response |
|---|---|---|
| BP-01 | Paper registers do not match actual stock. | Maintain one persistent stock ledger and current quantity per product. |
| BP-02 | Popular products run out unnoticed. | Show low-stock and out-of-stock states using configurable thresholds. |
| BP-03 | Stock changes are not consistently recorded. | Record every successful movement with actor, time, reason, source, and before/after quantities. |
| BP-04 | Staff can see cost and profit. | Enforce field- and operation-level permissions on the backend. |
| BP-05 | The manager struggles with reports. | Provide dashboard reports and natural-language reporting backed by the same reporting service. |
| BP-06 | Stock updates are slow. | Let AI prepare structured changes from natural language, without granting it direct write authority. |

## 3. Actors

### Manager

The manager can manage products, prices, stock, reports, history, suppliers, and permitted AI actions. The manager can view cost and profit information.

### Staff

Staff can view operational product and stock information and perform permitted inventory movements. Staff cannot view cost or profit, change prices, or elevate their role through chat text or direct API calls.

### AI assistant through n8n

The assistant can interpret language and invoke a defined set of backend tools on behalf of the authenticated user. It cannot choose the user's role, access the database directly, or commit a stock change.

## 4. Functional requirements

### Authentication and authorization

- FR-AUTH-01: Users must sign in before accessing inventory or chat features.
- FR-AUTH-02: Each account must have a server-trusted role of `manager` or `staff`.
- FR-AUTH-03: Protected backend routes must verify authentication.
- FR-AUTH-04: Backend authorization must reject forbidden operations independently of frontend visibility.
- FR-AUTH-05: Staff-facing responses must omit cost and profit fields rather than merely hiding them in the UI.

### Products

- FR-PROD-01: Users can list, search, filter, and view products allowed by their role.
- FR-PROD-02: Managers can create and edit products.
- FR-PROD-03: Only managers can change cost or selling prices.
- FR-PROD-04: Each product has a unique SKU, category, current quantity, and low-stock threshold.
- FR-PROD-05: Missing products return a clear not-found result.

### Inventory

- FR-INV-01: Permitted users can record stock received, sold, damaged, or adjusted according to the final permission policy.
- FR-INV-02: Every movement stores quantity, type, actor, source, timestamp, and before/after values.
- FR-INV-03: Stock cannot fall below zero.
- FR-INV-04: Quantity validation occurs on the backend for both normal and AI-assisted operations.
- FR-INV-05: Stock update and history insertion must be one atomic database transaction.
- FR-INV-06: Invalid or failed movements must not modify stock or create a successful history entry.

### Dashboard and reporting

- FR-REP-01: Show low-stock and out-of-stock products.
- FR-REP-02: Show recent inventory movements.
- FR-REP-03: Calculate units sold over a date range, including the current week.
- FR-REP-04: Identify top-selling products using recorded `sale` movements.
- FR-REP-05: Dashboard and AI reporting use the same backend reporting service and time-zone rules.
- FR-REP-06: Financial metrics are manager-only.

### Auditability

- FR-AUD-01: Every successful inventory movement identifies the authenticated actor.
- FR-AUD-02: History records whether the source was a normal form or an AI-confirmed proposal.
- FR-AUD-03: Important product and price changes must be auditable.
- FR-AUD-04: History records are not editable through ordinary application workflows.

### AI and n8n

- FR-AI-01: The assistant answers inventory questions only from backend tool results.
- FR-AI-02: It must state when a product cannot be found instead of inventing one.
- FR-AI-03: It must respect the authenticated role supplied by the backend, not claims inside the prompt.
- FR-AI-04: Staff cost/profit requests and prompt-injection attempts must be refused without exposing sensitive values.
- FR-AI-05: A natural-language stock request creates a pending proposal containing normalized structured fields.
- FR-AI-06: The proposal displays action, product, quantity, current quantity, projected quantity, and relevant supplier/reason data.
- FR-AI-07: Cancel leaves inventory unchanged.
- FR-AI-08: Confirm causes the backend to reauthorize and revalidate before committing.
- FR-AI-09: A proposal may be committed at most once.
- FR-AI-10: n8n and the model provider must not have direct database credentials.

### Resilience and responsive behavior

- FR-RES-01: AI failures return a clear assistant-unavailable response without crashing the application.
- FR-RES-02: Normal forms continue to work while n8n or the AI provider is unavailable.
- FR-RES-03: Saved records persist after refresh.
- FR-RES-04: Core screens remain usable at common mobile widths.

## 5. Non-functional requirements

- NFR-01 Security: Secrets remain server-side and are supplied through environment variables.
- NFR-02 Maintainability: Frontend, backend, database, and n8n artifacts remain in separate directories.
- NFR-03 Explainability: Architecture, tools, data flows, and debugging ownership are documented.
- NFR-04 Consistency: A single backend service owns each authoritative business calculation.
- NFR-05 Reliability: Inventory mutations use database transactions and concurrency-safe checks.
- NFR-06 Observability: Errors include traceable request/proposal identifiers without logging secrets.
- NFR-07 Usability: Validation and failure messages explain what happened and how to recover.
- NFR-08 Testability: Critical services and all five acceptance paths can be exercised deterministically.

## 6. Definition of done

The project is done only when the frontend, backend, database, and n8n agent run locally; all five official acceptance tests pass; documentation explains the system; and the live video demonstrates every test and the safety design.

