# Phase 5 — Backend Verification

## Automated checks

- TypeScript strict type-check: passed
- Production compilation: passed
- Inventory policy tests: 5 passed
- Product serialization tests: 2 passed
- Production dependency audit: no known production vulnerabilities at the Phase 4 security check

## Live PostgreSQL/API checks

| Check | Observed result | Status |
|---|---|---|
| Staff login | Authenticated role `STAFF` | Pass |
| Staff product serialization | No `costPriceMinor` or `unitMarginMinor` | Pass |
| Direct staff price PATCH | HTTP 403 | Pass |
| Sale 8 when quantity is 5 | HTTP 409 | Pass |
| Quantity after rejected sale | Remained 5 | Pass |
| Form stock-in | Type-C Cable 15 → 16 | Pass |
| Form sale rollback | Type-C Cable 16 → 15 | Pass |
| Movement history | Both reversible movements recorded | Pass |
| Unauthenticated product request | HTTP 401 | Pass |
| Manager product serialization | Cost field present | Pass |
| Top-selling report | Returned recorded sale | Pass |
| Manager financial report | Returned sale-derived totals | Pass |

The reversible verification movements remain in history by design because inventory history is immutable. Their net stock effect is zero, and both carry the reason `Phase 5 reversible verification`.

## Phase boundary

The backend currently operates entirely without n8n or an AI provider. This proves that authentication, normal forms, inventory rules, history, and reports are independent of AI availability, as required by acceptance test 5.
