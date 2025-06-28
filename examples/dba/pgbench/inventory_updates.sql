-- Inventory Updates Workload
-- Simulates inventory management causing lock contention

\set product_id random(1, 1000)
\set quantity_change random(1, 10)
\set user_id random(1, 100000)

-- 60% - Stock updates with row-level locking (causes contention)
BEGIN;
SELECT stock_quantity FROM products WHERE id = :product_id FOR UPDATE;
\sleep 2000ms
UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - :quantity_change)
WHERE id = :product_id;
COMMIT;

-- 20% - Batch inventory adjustments (longer locks)
BEGIN;
SELECT id, stock_quantity FROM products 
WHERE id BETWEEN :product_id AND (:product_id + 10)
FOR UPDATE;
\sleep 3000ms
UPDATE products 
SET stock_quantity = stock_quantity + (random() * 20)::int - 10
WHERE id BETWEEN :product_id AND (:product_id + 10);
COMMIT;

-- 15% - Purchase simulation (order creation with inventory check)
BEGIN;
-- Check stock
SELECT stock_quantity FROM products WHERE id = :product_id FOR UPDATE;
\sleep 1000ms
-- Create order
INSERT INTO orders (user_id, total_amount, status) 
VALUES (:user_id, (random() * 500 + 50)::decimal(10,2), 'pending');
-- Update inventory
UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - 1)
WHERE id = :product_id;
COMMIT;

-- 5% - Inventory reporting (shared locks conflicting with updates)
SELECT 
    p.category_id,
    COUNT(*) as total_products,
    SUM(p.stock_quantity) as total_stock,
    COUNT(CASE WHEN p.stock_quantity = 0 THEN 1 END) as out_of_stock
FROM products p
WHERE p.id BETWEEN :product_id AND (:product_id + 100)
GROUP BY p.category_id; 