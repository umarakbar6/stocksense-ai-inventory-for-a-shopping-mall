# Phase 7 Verification — Read-Only n8n Agent

## Outcome

Phase 7 implementation is complete. StockSense now has a real, read-only assistant path with clear component boundaries:

1. The frontend sends an authenticated chat message to the backend.
2. The backend derives the user and role from the session, signs a two-minute minimal context token, and calls n8n.
3. n8n performs intent routing and may call only an allow-listed backend read tool.
4. The backend revalidates the signed context and role, reads PostgreSQL through shared services, and returns a traceable tool result.
5. n8n returns a typed `answer`, `refusal`, or `unavailable` envelope; the frontend renders it without gaining database or n8n credentials.

No Phase 7 workflow can mutate inventory. Stock-change proposal and confirmation behavior belongs to Phase 8.

## Implemented artifacts

### Frontend

- `frontend/src/pages/AssistantPage.tsx`: live chat state, conversation continuity, prompt starters, error/refusal rendering, and trace display.
- `frontend/src/styles/assistant.css`: responsive, animated assistant presentation consistent with the StockSense visual system.

### Backend

- `backend/src/agent/contracts.ts`: strict request, response, intent, and tool contracts.
- `backend/src/agent/context-token.ts`: signed short-lived minimal user context.
- `backend/src/agent/internal-auth.ts`: timing-safe agent service authentication.
- `backend/src/agent/internal-tool-routes.ts`: allow-listed, role-enforced, read-only tools.
- `backend/src/agent/chat-routes.ts`: authenticated n8n gateway with timeout and error normalization.
- `backend/src/reports/report-service.ts`: reporting logic shared by normal APIs and agent tools.

### n8n

- `n8n/workflows/WF-01-chat-router.json`: webhook, provider routing, tool selection, authorization checks, and response envelope.
- `n8n/workflows/WF-02-grounded-read-answer.json`: deterministic formatting of grounded tool results.
- `n8n/workflows/WF-04-provider-error-handler.json`: controlled provider failure response.
- `n8n/start-local.ps1`: loopback-only startup using ignored local secrets and isolated runtime data.
- `n8n/scripts/validate-workflows.mjs`: validates non-empty exports and rejects embedded credentials.

The workflows were imported and published in n8n `2.41.5` with IDs:

- `stocksense-wf01-chat-router`
- `stocksense-wf02-grounded-read`
- `stocksense-wf04-error-handler`

## Verification evidence

- PostgreSQL-backed manager low-stock tool: `200`, one result, and a non-empty `toolResultId`.
- PostgreSQL-backed staff financial tool attempt: `403 FORBIDDEN`.
- Public chat with n8n unavailable: normalized `503 AGENT_UNAVAILABLE` while normal inventory remained usable.
- Public chat with n8n running: `200` typed `unavailable` response with `PROVIDER_ERROR` metadata.
- Browser acceptance check: manager login succeeded, live dashboard data loaded, the assistant request traversed frontend → backend → n8n → provider, and the safe unavailable message rendered in the chat.
- Backend unit tests: 9 passed.
- Backend and frontend type-checks: passed.
- Backend and frontend production builds: passed.
- n8n workflow validation: 3 non-empty exports passed with no embedded API keys or database URLs.

## External provider status

The original OpenAI integration authenticated and reached the provider, but the account returned HTTP `429` with code `credit_balance_exhausted`. To keep this academic project genuinely usable without payment, the provider node is being migrated to Gemini 2.5 Flash-Lite through Google AI Studio's documented free tier; n8n, signed context, allow-listed tools, and deterministic answer formatting remain unchanged.

This is an account-credit condition, not a missing application component. The failure is safely isolated: the assistant shows a clear unavailable message and all normal inventory features continue working.

## Remaining acceptance action

After the free Gemini API key is stored locally and the updated workflow is published, rerun one manager read query such as “Which products are running low?” and verify that the response contains the seeded low-stock product plus a backend `toolResultId`. This is a provider recheck, not a change to inventory authority.
