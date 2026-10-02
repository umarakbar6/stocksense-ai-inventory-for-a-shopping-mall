# Phase 2 — n8n Workflow Specification

## Common request envelope

The backend sends n8n a versioned payload containing `requestId`, `conversationId`, `message`, `userContextRef`, `role`, `locale`, and `timezone`. `role` is trusted only because the envelope is service-authenticated; chat text never overrides it.

The common response is `{ version, requestId, kind, message, citationsToToolResults, proposal? }`. The backend validates this schema before forwarding it.

## WF-01 Chat Router

**Trigger:** authenticated backend webhook.

**Nodes:** webhook validation → normalize payload → AI intent classifier with structured output → switch by intent → execute appropriate sub-workflow → validate response envelope → webhook response.

**Intent values:** `STOCK_QUERY`, `LOW_STOCK_QUERY`, `TOP_SELLING_QUERY`, `FINANCIAL_QUERY`, `MOVEMENT_REQUEST`, `UNSUPPORTED`.

**Failure path:** timeout, provider error, invalid structured output, or tool failure is mapped to `kind: unavailable` or a safe typed domain message. Raw provider errors are not shown to users.

## WF-02 Grounded Read Answer

**Inputs:** normalized intent, entities/date range, trusted role, context reference.

**Nodes:** authorize tool choice by role → call backend tool → check typed result → response formatter model or deterministic template → grounding check → return answer.

**Rules:**

- Numbers may appear only when present in the backend tool result.
- Unknown products produce explicit not-found language.
- Staff financial requests branch to refusal before financial data retrieval.
- Tool result IDs are retained in execution metadata for debugging.

## WF-03 Prepare Movement Proposal

**Inputs:** message, trusted role, context reference.

**Nodes:** structured extraction → validate required fields → search/resolve product through backend → handle zero or multiple matches → call `prepare-movement` tool → map proposal/rejection → return proposal card data.

**Extracted fields:** movement type, product phrase/SKU, positive quantity, optional supplier name, optional reason.

**Rules:**

- No database or mutation node exists in the workflow.
- Ambiguous product matches cause a clarification response, not a guess.
- Backend creates the pending proposal and computes display snapshots.
- Confirmation is not performed inside n8n.

## WF-04 Provider Error Handler

**Trigger:** workflow error events from WF-01 through WF-03.

**Nodes:** sanitize execution metadata → categorize timeout/configuration/provider/tool/schema failure → structured log → stable failure response when possible.

The handler must not log credentials or full sensitive payloads.

## Workflow versioning and files

Exports will be stored as non-empty JSON files under `n8n/workflows/` with names matching these IDs. Supporting schemas and prompt text will live under `n8n/schemas/` and `n8n/prompts/`. Credentials remain configured in n8n and are never exported into the repository.

## Required workflow tests

- Known stock query returns tool-backed quantities.
- Unknown product returns not found.
- Staff financial question and prompt injection return refusal without calling the financial tool.
- Valid stock-in request creates a pending proposal.
- Insufficient stock request returns typed rejection.
- Ambiguous product request asks for clarification.
- Provider failure returns a controlled unavailable response.

