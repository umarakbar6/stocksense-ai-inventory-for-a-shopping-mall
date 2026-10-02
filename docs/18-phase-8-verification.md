# Phase 8 Verification — Human-Confirmed AI Proposals

## Outcome

Phase 8 implements the complete confirmation boundary. The assistant may request a persisted proposal, but it cannot execute inventory changes. Only the authenticated proposal owner can call the backend Confirm endpoint, and the backend revalidates permissions, expiry, state, product availability, and current quantity inside a serializable transaction.

## Implemented flow

1. WF-01 classifies and extracts movement type, exact product phrase/SKU, positive whole-number quantity, optional supplier, and optional reason.
2. The service-authenticated `prepare-movement` backend tool resolves one active product and supplier; zero or multiple matches are rejected without guessing.
3. The backend applies role policy, verifies sufficient stock, computes current/projected quantities, and stores a 15-minute `PENDING` proposal with a unique idempotency key.
4. The frontend renders a review card. Cancel and Confirm send only the proposal ID.
5. Cancel atomically transitions `PENDING` to `CANCELLED` without changing stock.
6. Confirm locks the proposal and product, rechecks current truth, creates one `AI` movement, updates stock, writes an audit event, and marks the proposal `EXECUTED` in one serializable transaction.
7. Repeated Confirm returns the original movement with `idempotent: true` and applies no second delta.

## Security properties

- Proposal retrieval, cancellation, and confirmation require the same authenticated user who created it.
- Foreign proposals return `404` to avoid exposing their existence.
- Adjustment types remain manager-only and require a reason.
- Expired, cancelled, rejected, or otherwise non-pending proposals cannot execute.
- Insufficient stock is checked during preparation and again at confirmation.
- n8n and the browser never receive direct database credentials and cannot mark a proposal executed.
- The browser does not resubmit authoritative quantities during confirmation.

## Live acceptance evidence

The repeatable `npm run verify:phase8 --prefix backend` check ran against the live PostgreSQL database:

- First proposal: `15 → 55`, then Cancel.
- Quantity after Cancel: unchanged at `15` on the first acceptance run.
- Second proposal: `15 → 55`, then Confirm.
- Final Type-C Cable quantity: `55`.
- Repeated Confirm: `idempotent: true`.
- Movements linked to the confirmed proposal: exactly `1`.
- Stored movement source: `AI`.
- Stored actor: verified as the authenticated manager.
- Public owner GET: `EXECUTED`.
- Public repeated Confirm: original result returned.
- Staff attempt to retrieve the manager's proposal: `404`.

The acceptance proposal ID is `5f0cd0d8-9f54-4637-8f79-f6c557558dec` and its movement ID is `8fc86891-fb36-4070-93c9-86e2012a0d6b`, providing direct database traceability.

## Build and workflow verification

- Backend unit tests: 10 passed.
- Backend and frontend type-checks: passed.
- Backend and frontend production builds: passed.
- Frontend test command: passed with no test files configured.
- n8n validation: 4 non-empty workflow exports with no embedded API keys or database URLs.
- n8n runtime registry: WF-01, WF-02, WF-03, and WF-04 are present and active.
- Browser review: Phase 8 copy, movement starter, confirmation guarantees, responsive layout, and live inventory session render correctly.

## External provider recheck

The OpenAI account still returns `credit_balance_exhausted`. The backend-to-n8n-to-provider path correctly renders a controlled unavailable response, but the model-driven extraction of “Add 40 Type-C cables from Ali Traders” cannot be live-accepted until API credits are added. The normalized proposal tool and all downstream confirmation behavior are already verified against the live database.
