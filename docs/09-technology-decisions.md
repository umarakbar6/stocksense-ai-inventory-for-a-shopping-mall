# Phase 2 — Technology Decisions

## Selected stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 19, TypeScript, Vite | Fast local development, typed components, mature responsive ecosystem |
| UI styling | Tailwind CSS with accessible headless patterns | Consistent responsive UI without tying business rules to a component vendor |
| Server state | TanStack Query | Predictable API caching, mutation state, and invalidation after stock changes |
| Forms | React Hook Form and Zod | Typed validation and clear field errors; backend validation remains authoritative |
| Backend | Node.js LTS, TypeScript, Express | Clear modular API boundaries and straightforward n8n integration |
| Validation | Zod | Shared type vocabulary for public, internal-tool, and n8n response schemas |
| Database | PostgreSQL 17 | Strong transactions, constraints, locking, date queries, and production-grade relational behavior |
| ORM/migrations | Prisma | Typed data access, readable schema, versioned migrations, and seed support |
| Authentication | Server-issued JWT access token in an HttpOnly SameSite cookie | Browser-safe session transport with backend-controlled role lookup |
| Passwords | Argon2id | Modern password hashing with per-password salts |
| Agent orchestration | n8n | Explicit visual workflows, model/tool nodes, execution traces, and replaceable orchestration |
| Model access | OpenAI through n8n, behind a provider adapter contract | Reliable structured outputs while keeping provider concerns inside the agent boundary |
| Testing | Vitest, Supertest, React Testing Library, Playwright | Unit, API integration, component, and end-to-end coverage |
| Local services | Docker Compose for PostgreSQL and n8n | Reproducible versions and isolated persistent volumes |

## Runtime topology

- Frontend development server: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- PostgreSQL: container-only database port, exposed locally only for development tools
- n8n editor/runtime: `http://localhost:5678`
- Browser calls the backend only; it never calls PostgreSQL or n8n directly.

## Configuration boundaries

The repository will provide `.env.example` files with variable names and safe descriptions. Real `.env` files, database passwords, JWT secrets, n8n service tokens, and AI provider keys are ignored by Git and never placed in frontend code.

## Local installation note

The official EnterpriseDB PostgreSQL 16 and 17 winget downloads returned HTTP 403 during setup. The compatible PostgreSQL 17.7 Postgres Pro Standard distribution was installed instead and passed the live migration, seed, and integrity checks. Docker Compose uses the official PostgreSQL 17 image when Docker is available.

## Why not use SQLite

SQLite would simplify setup, but PostgreSQL better demonstrates row locking, concurrent stock safety, date-range reporting, durable constraints, and a realistic multi-user inventory system.

## Why Confirm is not an n8n workflow

Natural-language interpretation belongs in n8n. Confirm and Cancel are authenticated state transitions and therefore remain deterministic backend endpoints. This keeps inventory mutation available and understandable independently of the AI service.

