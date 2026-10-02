# Phase 1 — Data Flows

## Flow A: Normal stock-in

1. The user submits a stock-in form.
2. The frontend performs convenience validation and calls the backend.
3. The backend authenticates the user and checks the movement permission.
4. The inventory service validates the product and quantity.
5. A database transaction locks/checks the product, updates its quantity, and inserts a movement record.
6. The backend returns the committed movement and updated product summary.
7. The frontend refreshes the visible inventory and history data.

## Flow B: Stock question through AI

1. The user sends a chat message to the backend.
2. The backend authenticates the user and constructs trusted role context.
3. The backend sends the message and constrained context to the n8n chat webhook.
4. n8n selects an approved read tool.
5. n8n calls the backend's internal tool endpoint with service authentication.
6. The backend authorizes the tool for the original user and returns role-filtered real data.
7. n8n formats an answer grounded only in that tool result.
8. The backend validates the response envelope and returns it to the frontend.

## Flow C: AI stock proposal and Cancel

1. The user asks for a stock change.
2. n8n extracts a structured intent but performs no mutation.
3. A backend tool resolves the product and checks whether the movement is presently possible.
4. The backend stores a pending proposal with actor, normalized fields, before/projected quantities, expiry, and a unique idempotency key.
5. The frontend displays the proposal with Confirm and Cancel.
6. Cancel calls the backend, which changes proposal state from `pending` to `cancelled`.
7. Inventory remains unchanged and the cancelled proposal cannot later execute.

## Flow D: AI proposal and Confirm

1. Confirm sends only the proposal identifier to the backend; the browser does not resend authoritative quantities.
2. The backend authenticates the user and verifies proposal ownership, role, state, and expiry.
3. The backend reloads the product and revalidates current stock and normalized movement data.
4. One database transaction performs the stock update, inserts history, and marks the proposal `executed`.
5. Repeated confirmation sees `executed` and returns the original result without applying the movement again.
6. The frontend shows the committed movement and updated stock.

## Flow E: Unauthorized financial question

1. Staff sends a cost/profit question, including possible prompt injection.
2. The trusted role remains `staff` regardless of message content.
3. Financial tools reject the call or return a typed forbidden result.
4. No financial values are sent to n8n or the model.
5. The assistant returns a safe role-based refusal.

## Flow F: AI outage

1. A chat request encounters an n8n/model timeout or configuration failure.
2. The backend maps it to a stable assistant-unavailable response.
3. The frontend preserves the page and displays a recoverable chat error.
4. Normal forms continue to call independent backend endpoints and remain operational.

## Data consistency rule

Dashboard queries and AI report tools call the same reporting service with the same timezone and date-boundary functions. Normal forms and confirmed proposals call the same inventory service. This prevents parallel implementations from disagreeing.

