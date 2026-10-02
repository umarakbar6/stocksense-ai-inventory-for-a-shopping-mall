# Phase 1 — Debugging and Ownership Map

| Symptom | Primary owner | First checks | Secondary owner |
|---|---|---|---|
| Page layout or control is wrong | Frontend | route, component state, CSS, response handling | Backend if payload is wrong |
| Form accepts visibly invalid input | Frontend | form schema and messages | Backend remains authoritative |
| API accepts an invalid movement | Backend | request schema and inventory service | Database constraints |
| Stock differs from history | Backend | transaction boundaries and service logic | Database migration/constraints |
| Data disappears after refresh | Backend/Database | committed write, query, connection, migration | Frontend cache invalidation |
| Staff receives cost/profit | Backend | authorization and field projection | n8n tool selection/prompt |
| Staff sees a price-edit control | Frontend | role-aware navigation and components | Backend must still reject calls |
| Dashboard and AI disagree | Backend | shared reporting service, timezone, filters | n8n arguments |
| AI misunderstands natural language | n8n | prompt, structured output, workflow branch | Frontend context clarity |
| AI calls the wrong tool | n8n | tool descriptions and routing conditions | Backend tool authorization |
| AI invents a number | n8n | grounding prompt and result mapping | Backend response completeness |
| Confirm changes stock twice | Backend/Database | idempotency key, proposal state, transaction lock | Frontend disabled state |
| Cancelled proposal executes | Backend | proposal state transition checks | Database constraint/transaction |
| Chat failure crashes page | Frontend | error boundary and request handling | Backend error normalization |
| Chat unavailable but forms fail too | Backend architecture | accidental coupling to n8n | Frontend API separation |
| n8n cannot call a tool | n8n/Backend | service auth, URL, payload schema, logs | Runtime configuration |

## Diagnostic identifiers

Backend responses should eventually include a request ID. AI proposals have a proposal ID, n8n executions have an execution ID, and committed movements have a movement ID. Logs should connect these identifiers without storing passwords, tokens, raw secrets, or unnecessary sensitive prompts.

## Source-of-truth order

When investigating quantity differences, use this order:

1. Committed database state and movement ledger
2. Backend inventory/reporting service result
3. Public or internal API response
4. n8n mapped result
5. Frontend display

