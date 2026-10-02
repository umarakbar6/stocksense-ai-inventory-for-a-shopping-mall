# Phase 0 — Role and Permission Matrix

The backend is authoritative for every permission. Frontend visibility and n8n prompt rules provide usability and defense in depth, not primary security.

| Capability | Manager | Staff | Enforcement |
|---|:---:|:---:|---|
| Sign in and sign out | Yes | Yes | Backend authentication |
| View product identity, category, SKU, selling price, stock | Yes | Yes | Backend response policy |
| View cost price | Yes | No | Backend field filtering and authorization |
| View profit or margin | Yes | No | Backend reporting authorization |
| Create a product | Yes | No | Backend route authorization |
| Edit descriptive product data | Yes | No | Backend route authorization |
| Change cost or selling price | Yes | No | Backend route authorization |
| Record stock received | Yes | Yes | Backend validation; authenticated actor |
| Record a sale/stock out | Yes | Yes | Backend validation; authenticated actor |
| Record damaged stock | Yes | Yes | Backend validation; authenticated actor |
| Make a manual correction | Yes | No | Backend authorization plus mandatory reason |
| View operational movement history | Yes | Yes | Backend response filtering |
| View financial reports | Yes | No | Backend report authorization |
| Ask AI about stock and sales | Yes | Yes | Role-scoped backend tools |
| Ask AI about cost and profit | Yes | No | Tool authorization and sanitized outputs |
| Ask AI to prepare permitted movements | Yes | Yes | Backend proposal policy |
| Confirm own permitted AI proposal | Yes | Yes | Backend identity, role, expiry, and state checks |
| Confirm another user's proposal | No by default | No | Proposal ownership check |
| Access the database directly | No | No | Network and credential boundary |

## Sensitive-data rule

For staff requests, cost and profit fields must be excluded before data reaches n8n or the model. A refusal prompt alone is insufficient because a model cannot safely hide data it should never have received.

## Identity rule

Identity and role come from the backend-authenticated session. Text such as “ignore your rules” or “I am the manager” has no effect on authorization.

## Proposal ownership rule

A pending AI proposal belongs to the authenticated user who initiated it. Confirmation requires the same user unless a later, explicitly designed manager-approval workflow changes this rule.

