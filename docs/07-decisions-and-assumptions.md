# Phase 0–1 — Decisions and Assumptions

## Confirmed decisions

- DA-01: The project is StockSense even though the supplied brief filename contains `smart-gym-pwa`.
- DA-02: The codebase has explicit `frontend`, `backend`, `database`, and `n8n` boundaries.
- DA-03: n8n is the agent orchestration component requested by the user.
- DA-04: The backend is the sole authority for identity, roles, inventory rules, reporting truth, and writes.
- DA-05: n8n and the AI provider never receive database credentials.
- DA-06: A pending proposal is persisted so Confirm/Cancel and exactly-once behavior survive refreshes.
- DA-07: Cost and profit are removed from staff tool results before they reach n8n.
- DA-08: Application functionality is implemented before optional enhancements.
- DA-09: No empty placeholder files are permitted; every committed file must have a defined purpose and substantive content.

## Working assumptions to validate in Phase 2

- WA-01: “Sold most” means the largest sum of quantities in successful `sale` movements during the reporting interval.
- WA-02: “This week” uses Asia/Karachi time and begins Monday at 00:00.
- WA-03: Staff may record received, sold, and damaged stock but may not perform unrestricted manual corrections.
- WA-04: Selling price is operationally visible to staff; cost and derived profit are manager-only.
- WA-05: A supplier is optional for most movements but expected for stock received when supplied in the request.
- WA-06: A proposal is confirmable only by its creator and expires after a configurable short period.
- WA-07: Full offline operation and installable-PWA behavior are not required by the brief; responsive mobile operation is required.
- WA-08: Local development will use a relational database suitable for atomic transactions and constraints.

## Decisions deliberately deferred to Phase 2

- Exact frontend, backend, ORM, and database technologies
- Authentication/session mechanism
- n8n hosting mode and webhook authentication mechanism
- AI model provider and structured-output configuration
- Exact REST endpoint names and schemas
- Proposal expiry duration
- Currency representation and formatting

Deferred decisions will be resolved before runtime scaffolding so technology choices follow the requirements rather than determine them.

