# Vercel and Supabase deployment

Deploy the repository root, not only frontend/. The root vercel.json builds the
frontend and serves the Express backend through api/index.ts. Production frontend
requests use /api/v1 on the same origin, so secure HttpOnly login cookies work.

## Server-only Vercel environment variables

- DATABASE_URL: Supabase transaction pooler URI, using port 6543 and
  `?pgbouncer=true&connection_limit=1&sslmode=require`.
- NODE_ENV: production.
- FRONTEND_ORIGIN: https://stocksense-ai-inventory-for-a-shopp.vercel.app.
- JWT_SECRET, AGENT_SERVICE_SECRET, AGENT_CONTEXT_SECRET: separate random secrets,
  each at least 32 characters.
- N8N_WEBHOOK_URL: the hosted authenticated chat workflow URL, when available.
- APP_TIMEZONE: Asia/Karachi.

Never prefix database or agent secrets with VITE_. Supabase Auth accounts and
publishable/service-role API keys are not used by this application's existing
authentication system. Users live in the Prisma User table with Argon2 hashes.

## Initialize the database

Use the Supabase session pooler URI (port 5432) in DATABASE_URL for these commands:

```powershell
npx prisma migrate deploy --schema database/schema.prisma
npm run db:seed
```

Run the demo seed in a development shell against the intended new demo database;
the seed intentionally rejects NODE_ENV=production. It creates the documented
Manager and Staff accounts and sample inventory. Do not reset an existing
database or reuse another project's database without authorization.

Redeploy Vercel after saving the environment. Verify /api/v1/health, then both
logins, /auth/me, logout, persistence, and Staff financial access denial. Hosting
n8n remains a separate requirement for live assistant functionality.

## Configuration progress — 2026-10-08

Saved in the existing Vercel project for Production: FRONTEND_ORIGIN, NODE_ENV,
JWT_SECRET, AGENT_SERVICE_SECRET, and AGENT_CONTEXT_SECRET. Secret values are
stored privately in Vercel and are not included in this document or source code.

The root deployment adapter and same-origin frontend API changes are prepared
locally. `npm run build` passed and the 14 backend tests passed; the frontend test
runner currently has no test files. Supabase's StockSense project creation awaits
the owner's database password entry. DATABASE_URL, migration, seed, repository
root settings, redeployment, and live login verification remain pending. Do not
report the live login as fixed until those steps succeed.

Live preflight on 2026-10-08: GET /api/v1/health returned HTTP 200 with
text/html rather than backend JSON. POST /api/v1/auth/login returned HTTP 405
for both documented demo accounts. Supabase's organization project list has
AdmitCrew, FYP Compass, and My 1st Project; no StockSense database exists. The
five live acceptance cases are blocked by the missing deployed backend/database,
not passed. Existing local acceptance evidence does not certify this deployment.
