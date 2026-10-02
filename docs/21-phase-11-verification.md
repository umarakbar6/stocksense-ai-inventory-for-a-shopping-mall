# Phase 11 — Formal Acceptance Verification

## Outcome

Phase 11 has started and the complete five-scenario acceptance suite now runs against the live backend, PostgreSQL database, n8n service, agent-tool boundary, and saved 360×800 responsive evidence.

The final strict result is **5 passed, 0 failed**. Phase 11 is complete under the approved rule that every assertion and required evidence must pass.

| Test | Result | Verified now | Remaining blocker |
|---|---|---|---|
| AT-01 AI answers from real data | Pass | Gemini classifies the request; quantities match PostgreSQL; agent-tool and dashboard best-seller results match; unknown products return a grounded not-found answer. | None. |
| AT-02 AI change requires confirmation | Pass | Natural language produces a proposal; Cancel leaves stock unchanged; preview is 15 → 55 for Ali Traders; Confirm creates one AI movement; repeat confirmation is idempotent. | None. |
| AT-03 Stock cannot go below zero | Pass | Normal API, agent mutation tool, and chat path reject the over-sale; quantity remains 5; no movement or proposal is added. | None. |
| AT-04 Staff cannot exceed role | Pass | Both staff chat attempts are refused; product/tool responses exclude cost and margin; financial tool and direct price update return `403`; stored price is unchanged. | None. |
| AT-05 App works when AI does not | Pass | An isolated backend instance points to a deliberately unavailable provider endpoint; chat returns the controlled `503` response while normal stock-in persists and all six authenticated routes retain their mobile audit pass. | None. |

## Repeatable command

From the repository root:

```powershell
npm run build --prefix backend
npm run verify:acceptance --prefix backend
```

The runner exits with code 1 if any assertion fails and exits successfully only at `5/5 PASS`. It does not print or save the API key, service secret, signed user context, database URL, or staff-visible financial values.

## Evidence

- Machine-readable results: `docs/evidence/phase11/acceptance-results.json`
- Acceptance runner: `backend/scripts/verify-acceptance.mjs`
- Mobile measurements: `docs/evidence/phase10/responsive-audit.json`
- Phase 8 proposal and idempotency evidence: `docs/18-phase-8-verification.md`
- Phase 7 provider-path evidence: `docs/17-phase-7-verification.md`

The acceptance runner performs reversible stock-in/stock-out operations for AT-05 and confirms that the tested product returns to its original quantity. These two form movements remain in history as an honest audit trail.

## Gate decision

Phase 11 is complete. Phase 12 may begin after review of the machine-readable result. The paid OpenAI dependency was replaced with Gemini Flash-Lite's documented free tier inside n8n; no inventory authority, role check, or confirmation responsibility moved out of the backend.
