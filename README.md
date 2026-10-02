# StockSense AI Inventory

StockSense is a complete, role-aware inventory platform for a shopping mall. It combines a responsive React interface, an Express business API, PostgreSQL, and an n8n-orchestrated Gemini assistant. The conventional inventory system remains fully usable if the AI provider or n8n is unavailable.

## Final status

All 13 approved phases (0–12) are complete. The five formal acceptance scenarios pass against live PostgreSQL, backend APIs, n8n, and the Gemini free tier. Backend tests, production builds, workflow validation, security hardening, and 360px responsive checks are included.

## Live deployment

- **Vercel frontend:** [stocksense-ai-inventory-for-a-shopp.vercel.app](https://stocksense-ai-inventory-for-a-shopp.vercel.app)
- **GitHub repository:** [umarakbar6/stocksense-ai-inventory-for-a-shopping-mall](https://github.com/umarakbar6/stocksense-ai-inventory-for-a-shopping-mall)

The Vercel URL hosts the production React frontend and supports direct navigation to every client route. The complete authenticated system additionally requires the Express backend, PostgreSQL, n8n, and Gemini environment configuration described below. Those stateful services are intentionally not represented as hosted on Vercel.

## Component boundaries

| Directory | Responsibility |
|---|---|
| `frontend/` | React UI, responsive navigation, forms, reports, chat, and confirmation controls |
| `backend/` | Authentication, authorization, APIs, business rules, reports, proposals, and every inventory write |
| `database/` | Prisma schema, PostgreSQL migrations, constraints, indexes, and realistic seed data |
| `n8n/` | Agent prompts, intent routing, backend tool calls, Gemini classification, and controlled failure handling |
| `docs/` | Requirements, architecture, data flows, debugging guidance, evidence, and submission material |

The frontend and n8n never access PostgreSQL directly. The backend is the authority for permissions and data. An AI-proposed stock change is inert until its owner explicitly confirms it; execution is transactional and exactly once.

## Quick start

Prerequisites: Node.js 22+, PostgreSQL 16+, and n8n 2.x.

1. Copy `.env.example` to `.env.local` and fill the local values. Never commit `.env.local`.
2. Install dependencies with `npm install`.
3. Generate and migrate the database with `npm run db:generate` and `npm run db:migrate`.
4. Load demo data with `npm run db:seed`.
5. Start backend and frontend with `npm run dev`.
6. In a second terminal, start the agent runtime with `powershell -ExecutionPolicy Bypass -File n8n/start-local.ps1`.
7. Open `http://127.0.0.1:5173`.

Seeded demo accounts use password `StockSense-Demo-2026!` unless `SEED_DEMO_PASSWORD` was set:

- Manager: `manager@stocksense.local`
- Staff: `staff@stocksense.local`

## Verification commands

```powershell
npm run build
npm test
npm run db:validate
npm run validate --prefix n8n
npm run verify:acceptance --prefix backend
```

The acceptance runner writes machine-readable results to `docs/evidence/phase11/acceptance-results.json`.

## Safety guarantees

- Stock cannot become negative.
- Staff cannot read cost or profit data.
- Backend authorization holds even when the UI or n8n is bypassed.
- Assistant inventory answers come from authenticated backend tools and live database data.
- AI stock changes require an explicit owner-bound confirmation.
- Confirming the same proposal twice cannot apply the change twice.
- Provider outages fail safely and do not interrupt normal inventory work.

## Documentation

Start with [the final submission guide](docs/22-phase-12-submission.md). Architecture is in [docs/04-system-architecture.md](docs/04-system-architecture.md), data flow in [docs/05-data-flows.md](docs/05-data-flows.md), API contracts in [docs/11-api-contract.md](docs/11-api-contract.md), workflow details in [docs/12-n8n-workflows.md](docs/12-n8n-workflows.md), and troubleshooting in [docs/06-debugging-map.md](docs/06-debugging-map.md).
