# Frontend Component Contract

## Purpose

This directory will contain the responsive browser application for managers and staff.

## Owned responsibilities

- Authentication screens and session-aware navigation
- Manager and staff dashboards
- Product search, lists, details, and manager editing UI
- Stock-in, sale, damaged-stock, and permitted adjustment forms
- Movement history and report presentation
- Chat messages and structured proposal cards
- Confirm and Cancel user interactions
- Loading, empty, error, and AI-unavailable states
- Mobile-responsive and accessible layouts

## Prohibited responsibilities

- Direct database access
- Storing model or database secrets
- Treating hidden controls as authorization
- Authoritatively calculating stock or financial reports
- Applying inventory changes without the backend
- Trusting quantities resubmitted by the browser during confirmation

## Communication contract

The frontend communicates with public backend APIs only. Chat requests also go through the backend; the browser does not call n8n directly. This preserves authentication, stable error handling, and AI failure isolation.

## Planned Phase 2 outputs

Phase 6 implemented the complete normal application UI. Phase 7 replaced the agent preview with the live assistant, and Phase 8 adds structured proposal cards with action, product, quantity, supplier/reason, current/projected stock, expiry, status, and guarded Confirm/Cancel actions.

## Visual system

- Deep emerald operational workspace with lime, mint, coral, violet, and orange data accents
- Manrope display typography and DM Sans interface typography
- Responsive fixed/slide-out navigation
- Animated gradient insight banner, metric cards, charts, loaders, and staggered page entrances
- Reduced-motion support and accessible focus/semantic controls
- Modular CSS under `src/styles/` instead of one monolithic stylesheet

## Verified behavior

- Manager dashboard displays live totals: four products, 76 units, one low-stock item.
- Catalogue renders four live product cards.
- Staff catalogue omits manager-only add/edit controls.
- Logout clears both server and client session state.
- Mobile viewport at 390×844 shows one-column cards and working slide-out navigation.
- API hostname inheritance works for both `localhost` and `127.0.0.1` development origins.
- The assistant posts only to the authenticated backend, preserves conversation IDs, renders grounded trace metadata, and presents refusal/unavailable states without breaking normal inventory screens.

## Phase 10 responsive verification

- Dashboard, products, record-stock, history, reports, and assistant routes were rendered at 360×800 in installed Edge through the repeatable `npm run verify:responsive --prefix frontend` check.
- Every route has zero page-level horizontal overflow, zero unnamed interactive controls, and zero visible controls below 40×40 CSS pixels.
- The mobile navigation drawer has an accessible close control; assistant starters, composer, and send control meet the touch-target floor.
- Evidence PNGs and machine-readable metrics are stored under `docs/evidence/phase10/`.

