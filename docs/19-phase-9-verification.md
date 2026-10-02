# Phase 9 Verification — Security and Failure Hardening

## Controls added

- Cross-site state-changing requests are rejected with `403 FORBIDDEN`; safe reads and non-browser service calls remain available.
- CORS failures now receive a request ID and stable typed error instead of becoming generic server errors.
- Login is limited to 10 attempts per IP per 15 minutes, chat to 30 requests per minute, and proposal routes to 60 requests per minute.
- Rate-limit storage is bounded and expired buckets are pruned.
- Incoming request IDs accept only 1–128 log-safe letters, numbers, dots, underscores, colons, and hyphens; unsafe values are replaced with a UUID.
- Malformed JSON returns `400 VALIDATION_FAILED`; payloads over 256 KiB return `413 PAYLOAD_TOO_LARGE`.
- Unexpected errors log only request ID and error category, not raw request, database, cookie, token, or provider details.
- Every internal agent-tool call rechecks that the user is active and uses the user's current database role.
- n8n remains loopback-only and now disables diagnostics, template, personalization, and version-notification calls.

## Verified attacks and failures

- Hostile Origin plus `Sec-Fetch-Site: cross-site` write: `403 FORBIDDEN`.
- Forged internal service bearer token: `401 AUTH_REQUIRED`.
- Unsafe request-ID header: discarded and replaced with a UUID.
- Malformed JSON: `400 VALIDATION_FAILED`.
- Oversized chat payload: `413 PAYLOAD_TOO_LARGE`.
- Expired proposal confirmation: rejected and terminal `EXPIRED` state persisted.
- Sale proposal exceeding current stock: `INSUFFICIENT_STOCK`, no proposal row, no stock change.
- Staff adjustment proposal: `FORBIDDEN`, no proposal row, no stock change.
- Foreign proposal access: `404`.
- Duplicate confirmation: original movement returned, no second delta.
- OpenAI credit/provider failure: controlled assistant-unavailable message while inventory APIs remain healthy.

## Verification results

- Backend unit tests: 14 passed across inventory, serialization, agent contracts, trusted-origin policy, and rate limiting.
- Live Phase 9 database verifier: passed with stock unchanged and zero rejected-proposal rows.
- Backend type-check and production build: passed.
- Production dependency audit completed at high severity threshold without a reported finding.
- Four non-empty n8n workflow exports continue to pass the credential scan.
- No empty source, workflow, database, or documentation files were introduced.

## Remaining provider-dependent checks

The OpenAI account still reports `credit_balance_exhausted`. Prompt-injection resistance is implemented through trusted backend role derivation, strict structured output, pre-tool role authorization, current-role revalidation, and manager-only backend enforcement. A live model prompt-injection trace can be captured after API credits are added; staff financial and direct authorization boundaries are already independently verified.
