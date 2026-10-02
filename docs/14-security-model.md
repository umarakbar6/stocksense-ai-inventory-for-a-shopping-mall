# Phase 2 — Security and Failure Model

## Authentication

- Passwords are hashed with Argon2id.
- A successful login issues a short-lived signed token in an HttpOnly, SameSite cookie.
- The backend reloads the active user and current role for protected requests rather than trusting a role supplied by the browser.
- State-changing routes require CSRF protection appropriate to the final cookie configuration and deployment origin.

## Authorization

- Route policies protect manager-only operations.
- Service policies protect movement types and financial calculations.
- Response serializers omit fields forbidden to the active role.
- Internal n8n tools authorize both the tool and the referenced user context.

## Agent boundary

- The backend signs time-limited user-context references for n8n.
- n8n calls internal tools using a separate service credential.
- Tool payloads are schema-validated and replay-limited.
- The model never receives database credentials, password hashes, auth cookies, JWT secrets, or unrestricted product rows.
- Model output is treated as untrusted input and validated before use.

## Inventory concurrency

The confirmation or normal-movement transaction re-reads and locks the affected product row before calculating the next quantity. It rejects any operation that would make quantity negative. The movement record and quantity update commit together.

AI confirmation additionally locks the proposal row. Only `PENDING` proposals may transition to `EXECUTED`; repeated confirmation returns the stored movement result without another delta.

## Validation

- IDs use UUID validation.
- Quantities are positive bounded integers.
- Money is non-negative bounded integer minor units.
- Free text has length limits and is escaped on presentation.
- Enums reject unknown movement, role, source, and state values.
- Pagination and report intervals have safe limits.

## Failure behavior

| Failure | Public behavior | Data behavior |
|---|---|---|
| Invalid form | Field/domain error | No write |
| Insufficient stock | Conflict with available quantity | No write |
| Forbidden operation | Generic permission error | No write and optional security audit |
| Database transaction failure | Safe retry message | Entire transaction rolled back |
| n8n/model timeout | Assistant unavailable | Normal endpoints unaffected |
| Invalid n8n response | Assistant unavailable and diagnostic log | No proposal or write unless already durably created |
| Duplicate confirm | Original committed result | No second movement |

## Logging

Logs may contain request ID, authenticated user ID, route/tool name, proposal ID, movement ID, status, latency, and sanitized error category. Logs must exclude passwords, tokens, cookies, credential values, and unnecessary financial/chat content.

