# Phase 12 — Final Submission and Demonstration Guide

## Delivery statement

StockSense is complete across four deliberately separated implementation layers: frontend, backend, database, and agent orchestration. The repository contains working code, migrations, seed data, four importable n8n workflows, tests, evidence, and operational documentation. No layer is a placeholder.

## What the evaluator should see

1. A polished responsive dashboard and inventory workflow.
2. Manager and staff roles with visibly different access.
3. Live inventory search and low-stock answers through the assistant.
4. A stock adjustment prepared by AI but not applied before confirmation.
5. Exactly one stock movement after Confirm, even if confirmation is repeated.
6. Normal inventory screens continuing to work during an assistant/provider failure.

## System map

```text
React frontend ──JWT/HTTP──> Express backend ──Prisma──> PostgreSQL
      │                         ▲
      └──JWT/HTTP──> n8n agent ─┘
                         │
                         └──> Gemini free-tier intent classification
```

The backend is the sole data authority. n8n owns replaceable agent logic and prompts, but accesses inventory only through narrowly scoped authenticated backend tools. This separation means prompts or providers can change without searching through UI, database, or business-rule code.

## Clean setup

1. Install Node.js 22+, PostgreSQL 16+, and n8n 2.x.
2. Copy `.env.example` to `.env.local` and supply local database, JWT, n8n, and Gemini values.
3. Run `npm install`, `npm run db:generate`, `npm run db:migrate`, then `npm run db:seed`.
4. Run `npm run dev` for backend and frontend.
5. Run `powershell -ExecutionPolicy Bypass -File n8n/start-local.ps1` in another terminal.
6. Visit `http://127.0.0.1:5173`.

Demo password is `StockSense-Demo-2026!` unless overridden with `SEED_DEMO_PASSWORD`.

| Role | Email | Demonstrates |
|---|---|---|
| Manager | `manager@stocksense.local` | Full inventory, cost/profit reports, users, assistant proposals |
| Staff | `staff@stocksense.local` | Operational inventory without cost/profit visibility |

## Seven-minute demonstration script

1. **Architecture (45 seconds):** show the four component directories and explain backend-mediated data access.
2. **Manager dashboard (45 seconds):** show KPI cards, low-stock signals, recent activity, and responsive navigation.
3. **Core inventory (60 seconds):** search products, inspect history, and record a conventional movement to prove the app does not depend on AI.
4. **Role enforcement (45 seconds):** sign in as staff and show protected cost/profit data and routes are unavailable.
5. **Read-only assistant (60 seconds):** ask for low-stock products or Type-C cable stock; explain that n8n calls backend tools.
6. **Human-confirmed action (90 seconds):** ask to add stock, inspect the proposal, Confirm, and show the movement. Repeat Confirm to demonstrate no duplicate.
7. **Resilience and evidence (45 seconds):** explain safe provider failure while normal inventory survives, then show the acceptance result.

## Acceptance result

All five official scenarios pass. Machine-readable evidence is in `docs/evidence/phase11/acceptance-results.json`; the readable analysis is `docs/21-phase-11-verification.md`.

| Test | Expected result | Final result |
|---|---|---|
| AT-01 | Staff cannot see protected financial data | PASS |
| AT-02 | Assistant answers from live inventory | PASS |
| AT-03 | Proposed stock change requires confirmation | PASS |
| AT-04 | Confirm is owner-bound and exactly once | PASS |
| AT-05 | Provider outage fails safely; normal app survives | PASS |

## Debugging route

| Symptom | First place to inspect | Then inspect |
|---|---|---|
| UI or form issue | Browser network/console and `frontend/src/` | Backend response contract |
| 401/403 | JWT/cookie and backend auth middleware | Role rules in `docs/03-role-permissions.md` |
| Incorrect stock | Backend movement/proposal service | PostgreSQL movements, constraints, transaction logs |
| Assistant unavailable | n8n execution log | Gemini key/quota and backend tool response |
| Proposal not executable | Proposal owner/status/expiry | Idempotency and stock validation |
| Database startup failure | `DATABASE_URL` and PostgreSQL service | Prisma migration state |

The detailed fault-isolation guide is `docs/06-debugging-map.md`.

## Submission checklist

- [x] Frontend is functional, animated, accessible, and responsive at 360px.
- [x] Backend contains real APIs, authorization, validation, business rules, and tests.
- [x] PostgreSQL schema, migrations, constraints, indexes, and seed data are present.
- [x] n8n has four substantive workflows with prompts, tools, routing, and failures handled.
- [x] Agent actions use backend tools and never write directly to the database.
- [x] Formal acceptance evidence records five passing scenarios.
- [x] Build, automated tests, workflow validation, and empty-file audit pass.
- [x] Secrets stay in ignored local environment configuration, not workflow JSON or source.
- [x] Setup, architecture, data flow, debugging, demo, and security documentation are included.

## Security handoff

`.env.local` is intentionally excluded from version control. Because the current Gemini key was pasted into a chat during setup, rotate it in Google AI Studio before publishing or sharing the repository, then update only the local environment file. Never put credentials into screenshots, documentation, source code, or exported workflow JSON.
