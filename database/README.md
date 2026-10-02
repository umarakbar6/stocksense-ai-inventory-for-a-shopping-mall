# Database Component Contract

## Purpose

This directory will contain versioned relational database artifacts and data-model documentation.

## Planned data ownership

- Users and trusted roles
- Categories and products
- Suppliers where required
- Current product quantities
- Immutable stock movement records
- Pending/cancelled/expired/executed AI proposals
- Audit metadata for sensitive changes

## Integrity requirements

- Unique user identifiers and product SKUs
- Non-negative current stock
- Positive movement quantities
- Enumerated movement and proposal states
- Foreign-key integrity for actor, product, supplier, and proposal relationships
- Atomic inventory update, movement insertion, and proposal execution
- Indexes supporting product search, recent history, and date-range sales reports

## Planned artifacts

Phase 2 will produce the logical schema and entity relationship model. The implementation phase will then add non-empty migrations and realistic seed data for manager/staff accounts, products, suppliers, and acceptance-test scenarios.

No application component other than the backend will receive database credentials.

