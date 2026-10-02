# Phase 2 — Frontend Route and Screen Map

## Public route

| Route | Screen | Purpose |
|---|---|---|
| `/login` | Login | Authenticate manager or staff and show safe credential errors |

## Authenticated routes

| Route | Access | Screen responsibilities |
|---|---|---|
| `/` | Both | Role-aware operational dashboard |
| `/products` | Both | Search, category/status filters, role-filtered product data |
| `/products/:id` | Both | Product details, stock state, recent history |
| `/products/new` | Manager | Create product |
| `/products/:id/edit` | Manager | Edit product and prices |
| `/inventory/new` | Both | Record permitted stock movement |
| `/history` | Both | Filter movement history |
| `/reports` | Both | Operational reports; financial panels manager-only |
| `/assistant` | Both | Chat, proposal card, Confirm/Cancel, unavailable state |

## Shared layout

- Desktop sidebar and mobile navigation
- Current role/user indicator
- Global low-stock badge when relevant
- Route-level error boundary
- Toast/inline feedback for mutations
- Sign-out action

## Proposal-card contract

The card shows product, action, quantity, supplier/reason when present, current snapshot, projected snapshot, expiry, and status. Confirm/Cancel calls reference the proposal ID. Buttons disable during a request and after a terminal state, while backend idempotency remains the true duplicate-execution defense.

## Responsive rules

- Core actions remain reachable at 360 CSS pixels wide.
- Wide tables become horizontally safe tables or labelled cards without losing fields.
- Chat input and proposal actions remain visible without overlap.
- Touch controls meet reasonable target sizes.
- Dialogs remain within the viewport and support keyboard focus.

## Client data rules

TanStack Query owns server data. Successful mutations invalidate the relevant product, history, dashboard, report, and proposal queries. Sensitive manager data is never placed in staff responses, caches, or local storage.

