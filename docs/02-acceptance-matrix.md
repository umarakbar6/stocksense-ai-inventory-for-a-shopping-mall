# Phase 0 — Acceptance-Test Matrix

## AT-01: AI answers from real data

**Setup:** Create products, then record stock-in and sale movements through normal forms.

**Actions:** Ask the assistant for the remaining quantities of three products, the best-selling product for the current week, and an unknown product.

**Expected results:**

- Each quantity equals the product page and database-derived stock value.
- Best seller equals the dashboard result for the same week and time zone.
- An unknown product is reported as not found.
- No answer contains an invented number.

**Component evidence:** frontend chat and dashboard; backend tool responses; database movements; n8n execution trace without secrets.

## AT-02: AI change requires confirmation

**Setup:** Type-C Cable has quantity 15.

**Actions:** Request “Add 40 Type-C cables from Ali Traders.” Cancel the first proposal. Repeat and confirm the second proposal.

**Expected results:**

- Proposal shows 15 → 55 and supplier Ali Traders.
- Inventory stays 15 before confirmation and after Cancel.
- Confirm changes inventory to 55 exactly once.
- Repeating the confirmation does not change inventory to 95.
- History records +40, before 15, after 55, authenticated actor, source `ai`, and proposal ID.

**Component evidence:** frontend proposal card; backend proposal/confirmation responses; database movement; n8n workflow execution.

## AT-03: Stock cannot go below zero

**Setup:** A product has quantity 5.

**Actions:** Attempt to record a sale of 8 through the normal form, then through AI chat.

**Expected results:**

- Both paths return a clear insufficient-stock error.
- Quantity remains 5.
- No successful movement is stored.
- The AI proposal is rejected or becomes non-executable.

**Component evidence:** frontend errors; backend validation results; unchanged database state.

## AT-04: Staff cannot exceed their role

**Setup:** Sign in as staff.

**Actions:** Ask for cost/profit; send a prompt-injection claim of being the manager; directly send a price-update API request.

**Expected results:**

- Both chat attempts are refused without sensitive values.
- Tool responses sent to n8n contain no manager-only financial fields.
- Direct price update returns `403 Forbidden`.
- Product values remain unchanged.

**Component evidence:** frontend refusal; sanitized backend response; authorization log; unchanged product record.

## AT-05: App works when AI does not

**Setup:** Make n8n or model-provider configuration unavailable in a controlled development environment.

**Actions:** Send a chat message; record stock-in through the normal form; refresh; inspect a mobile viewport.

**Expected results:**

- Chat displays a clear temporary-unavailability message.
- Normal stock-in succeeds and persists after refresh.
- No page-wide crash occurs.
- Core controls remain usable at mobile width.

**Component evidence:** chat error state; successful backend/database record; refreshed product page; mobile screenshot.

## Exit rule

An acceptance test passes only when all expected results and listed evidence are present. A partial result is a failure and must be corrected before submission.

