# Phase 1 — System Architecture

## 1. High-level design

```text
Browser
  │ HTTPS/JSON
  ▼
Frontend application
  │ authenticated API calls
  ▼
Backend API ───────────────► Relational database
  │                            products, users,
  │ signed internal request    movements, proposals
  ▼
n8n agent orchestration
  │ model API
  ▼
AI provider
```

n8n calls only allow-listed backend tool endpoints. It never connects directly to the database. The backend authenticates browser users, decides roles, sanitizes tool data, validates proposals, and owns every transaction.

## 2. Frontend boundary

The frontend owns routes, components, forms, tables, dashboard presentation, chat presentation, responsive behavior, and client-side convenience validation. It receives already-authorized data and must tolerate backend or agent errors.

It does not own role truth, stock calculations, report truth, inventory mutation, or model secrets.

See `frontend/README.md` for the component contract.

## 3. Backend boundary

The backend owns public APIs, authentication, role checks, input validation, product services, inventory services, reporting services, audit creation, agent gateway calls, internal tool endpoints, proposal state transitions, and error normalization.

The same inventory service is used by normal forms and AI confirmation. The same reporting service is used by dashboards and AI read tools.

See `backend/README.md` for the component contract.

## 4. Database boundary

The relational database stores durable application state. Constraints support uniqueness and valid values; transactions keep current quantities and movement history consistent. Migrations and seeds are versioned under `database/`.

See `database/README.md` for the planned data ownership.

## 5. n8n agent boundary

n8n owns the conversational orchestration layer: prompt construction, intent/tool selection, structured proposal preparation, and presentation-ready assistant responses. It receives a short-lived signed request containing the trusted user context needed for a workflow. It cannot grant permissions or commit inventory.

See `n8n/README.md` for workflow boundaries and planned artifacts.

## 6. Trust boundaries

1. Browser input is untrusted.
2. Chat text is untrusted and never defines authorization.
3. n8n/model output is untrusted and schema-validated by the backend.
4. Only the backend has application database credentials.
5. Only backend services perform authoritative calculations and mutations.
6. Internal n8n callbacks require service authentication, replay protection, and an allow-listed schema.

## 7. Failure isolation

- If the model provider fails, n8n returns a controlled failure to the backend.
- If n8n fails, the backend returns an assistant-unavailable error only for chat requests.
- Normal product, inventory, history, and reporting endpoints do not depend on n8n.
- If the database fails, both normal and AI-backed data operations fail safely without fabricated success.

## 8. Replaceability goal

The backend depends on an agent-gateway contract rather than n8n-specific internals. This allows n8n or the model provider to be replaced later without rewriting product, inventory, or reporting services.

