# Database Seeding

The development seed is idempotent: repeated runs update known demo users, categories, supplier details, and product descriptions/prices without duplicating opening-balance movements.

## Demo identities

- Manager: `manager@stocksense.local`
- Staff: `staff@stocksense.local`

Both use `SEED_DEMO_PASSWORD`. When that variable is absent outside production, the local-only fallback is `StockSense-Demo-2026!`. Production seeding is explicitly blocked.

## Acceptance data

- Type-C Cable starts at 15 so the required AI proposal can demonstrate 15 → 55.
- Classic Cotton T-Shirt starts at 5 and is below its threshold, supporting low-stock and negative-stock tests.
- Ali Traders exists for the required supplier example.
- Grocery, Clothing, Electronics, and Household categories match the mall brief.

## Run sequence

1. Supply a valid `DATABASE_URL` in `backend/.env` or the current shell.
2. Apply the migration with `npm run db:migrate`.
3. Set a private `SEED_DEMO_PASSWORD` if desired.
4. Run `npm run db:seed`.
5. Execute `database/integrity-checks.sql` and confirm the violation queries return no rows.
