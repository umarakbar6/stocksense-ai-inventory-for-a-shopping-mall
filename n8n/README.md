# n8n Agent-Orchestration Contract

## Purpose

This directory will contain exported n8n workflows and supporting documentation for the StockSense assistant. n8n is an orchestration layer, not the inventory authority.

## Owned responsibilities

- Receive authenticated, signed chat jobs from the backend
- Construct role-aware model context from trusted backend metadata
- Classify inventory questions versus stock-change requests
- Select allow-listed backend tools
- Map tool results into grounded user-facing answers
- Extract normalized stock proposal fields
- Request backend creation of pending proposals
- Return structured response envelopes to the backend
- Convert model/provider failures into controlled workflow errors

## Prohibited responsibilities

- Direct database access
- Trusting a role claimed inside chat text
- Receiving staff-forbidden financial data
- Committing inventory mutations
- Marking proposals executed
- Reimplementing backend inventory or reporting calculations
- Returning unsupported numbers from model knowledge

## Implemented Phase 7 artifacts

The repository contains importable, non-empty workflow exports for:

1. Chat router and response envelope
2. Grounded inventory/reporting question flow
3. Centralized AI-provider error handling

`WF-03` now validates normalized movement fields and asks the backend to persist a pending proposal. WF-01 routes movement intent to the allow-listed `prepare-movement` tool and returns a structured proposal envelope. Neither workflow can confirm a proposal or write inventory.

## Runtime

- Start local n8n: `npm start --prefix n8n`
- Validate exports: `npm run validate --prefix n8n`
- Import exports: `npm run import --prefix n8n`
- Local UI: `http://127.0.0.1:5678`

`start-local.ps1` reads the ignored root `.env.local`, validates the required service and encryption secrets, binds n8n to loopback, and keeps runtime state in ignored `n8n/data/`.

Local startup disables diagnostics, templates, personalization, and version-notification network calls. Workflow code retains environment access only because it needs the scoped Gemini and backend service credentials.

The runtime uses n8n `2.47.7`. The active workflow identifiers are `stocksense-wf01-chat-router`, `stocksense-wf02-grounded-read`, `stocksense-wf03-prepare-movement`, and `stocksense-wf04-error-handler`. The production webhook URL is configured through `N8N_WEBHOOK_URL`; do not hard-code or expose the service secret in an export.

When the repository is inside a cloud-synchronized directory, select a local runtime profile before both synchronization and startup to avoid SQLite locking:

```powershell
$env:N8N_USER_FOLDER = Join-Path $env:LOCALAPPDATA "StockSense-n8n"
powershell -ExecutionPolicy Bypass -File n8n/sync-workflows.ps1
powershell -ExecutionPolicy Bypass -File n8n/start-local.ps1
```

Both scripts honor the same `N8N_USER_FOLDER`. Run synchronization while n8n is stopped, then restart it so published webhooks are registered.

## Agent behavior

Gemini Flash-Lite performs strict-schema intent classification only through Google AI Studio's free tier. The runtime uses Google's `gemini-flash-lite-latest` alias so the project follows the supported free Flash-Lite model. n8n authorizes the intent from trusted role metadata, calls one allow-listed backend tool, and deterministically formats the result. Every data-backed answer includes a backend `toolResultId`. Staff financial requests are refused before the financial endpoint is called.

## Replaceability

The backend talks to n8n through a versioned agent-gateway contract. A future agent implementation can replace n8n without changing database or core inventory services.


## Runtime security and upstream findings

The local runtime is pinned to stable n8n 2.47.7. Configure n8n's built-in owner account before activating workflows; environment variables named `N8N_BASIC_AUTH_*` are not an authentication setup for this runtime. Keep the editor on loopback. Public production webhooks require a deliberately configured HTTPS reverse proxy and private webhook authentication; do not expose the editor by changing its bind address.

The shipped launch settings disable community package loading and the unused public management API, and exclude Execute Command, Local File Trigger, and Read/Write Files nodes. The supplied workflows use none of those nodes. Docker drops Linux capabilities and prevents privilege escalation. Code-node environment access remains enabled because the existing trusted workflows require their scoped provider/service credentials; use a dedicated instance and do not import untrusted workflows.

A separate npm resolution/audit of the upstream n8n 2.47.7 runtime on 14 November 2026 reported 147 affected package entries: 7 critical, 69 high, 67 moderate and 4 low, spanning 126 unique advisory URLs. These counts include inherited package risk and do not establish exploitability of this deployment. The five application-root audits exclude this separate runtime. Latest/stable on npm was already 2.47.7; this audit did not identify a clean supported stable n8n upgrade. Restrictions reduce exposure but do not patch vulnerable bundled libraries. Review upstream releases and re-audit before public or sensitive production use. Docker image/OS-layer contents were not scanned.

Sources: [official package versions](https://www.npmjs.com/package/n8n?activeTab=versions), [node restrictions](https://docs.n8n.io/hosting/configuration/environment-variables/nodes/), [disable the public API](https://docs.n8n.io/hosting/securing/disable-public-api/). On a configured running instance, run `n8n audit` to review instance-level credentials, unsafe nodes and webhook settings; that command was not run against a live deployment here.
