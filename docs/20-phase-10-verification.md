# Phase 10 Verification — Responsive Usability

## Scope

Phase 10 validates the six authenticated user routes at the brief's minimum supported width of 360 CSS pixels:

- Dashboard
- Products
- Record stock
- History
- Reports
- AI assistant

The repeatable QA command is `npm run verify:responsive --prefix frontend`. It launches installed Microsoft Edge headlessly, applies a 360×800 device viewport, uses a short-lived locally signed manager session, captures every route, and writes machine-readable metrics. It never stores the session token or a password.

## Issues found and corrected

- Added an accessible name to the mobile navigation close button.
- Increased icon controls from 36px to 44px.
- Increased assistant starter controls to at least 40px high.
- Increased the assistant text input hit area to 40px and its send control to 44px.
- Adjusted the mobile assistant height so the composer remains visible without overlapping chat content.
- Expanded compact dashboard links to a minimum 40px target and the primary insight action to 44px high.
- Improved capture warm-up so evidence reflects loaded live data rather than transient authentication/loading frames.

## Automated results at 360×800

| Route | Page overflow | Unnamed controls | Controls below 40px |
|---|---:|---:|---:|
| Dashboard | 0 | 0 | 0 |
| Products | 0 | 0 | 0 |
| Record stock | 0 | 0 | 0 |
| History | 0 | 0 | 0 |
| Reports | 0 | 0 | 0 |
| Assistant | 0 | 0 | 0 |

The history table remains contained in its intentional horizontal scroll region; it does not widen the page. The assistant starter row also scrolls within its own container and does not overlap the composer.

## Visual review

- The mobile dashboard keeps the focus banner and metric cards legible in one column.
- Products and reports collapse to single-column cards without clipped values.
- The record-stock form keeps movement choices, labels, and inputs reachable.
- The history filters wrap cleanly and the table remains horizontally safe.
- The assistant composer remains visible, with horizontally scrollable starters and a single-column proposal-card layout.
- The slide-out navigation covers the viewport predictably, includes all routes and user identity, and has a clearly labelled close button.
- The desktop browser remains free of page-level overflow and retains the fixed sidebar/two-column information hierarchy.

## Evidence

- `docs/evidence/phase10/responsive-audit.json`
- `docs/evidence/phase10/dashboard-360.png`
- `docs/evidence/phase10/products-360.png`
- `docs/evidence/phase10/record-stock-360.png`
- `docs/evidence/phase10/history-360.png`
- `docs/evidence/phase10/reports-360.png`
- `docs/evidence/phase10/assistant-360.png`
- `docs/evidence/phase10/navigation-open-360.png`
