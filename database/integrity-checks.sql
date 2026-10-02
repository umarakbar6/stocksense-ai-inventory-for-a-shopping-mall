-- Run after migrations and seeds. Every query should return zero rows except the summary.

SELECT id, sku, quantity
FROM products
WHERE quantity < 0;

SELECT id, product_id, quantity, delta, before_quantity, after_quantity
FROM stock_movements
WHERE quantity <= 0
   OR delta = 0
   OR ABS(delta) <> quantity
   OR after_quantity <> before_quantity + delta
   OR before_quantity < 0
   OR after_quantity < 0;

SELECT id, quantity, before_quantity, projected_quantity
FROM ai_proposals
WHERE quantity <= 0
   OR before_quantity < 0
   OR projected_quantity < 0;

SELECT p.id, p.status, p.executed_movement_id, m.id AS linked_movement_id
FROM ai_proposals p
LEFT JOIN stock_movements m ON m.proposal_id = p.id
WHERE (p.status = 'EXECUTED' AND (p.executed_movement_id IS NULL OR m.id IS NULL))
   OR (p.status <> 'EXECUTED' AND p.executed_movement_id IS NOT NULL);

SELECT
  (SELECT COUNT(*) FROM users) AS users,
  (SELECT COUNT(*) FROM products) AS products,
  (SELECT COUNT(*) FROM stock_movements) AS movements,
  (SELECT COUNT(*) FROM ai_proposals) AS proposals;

