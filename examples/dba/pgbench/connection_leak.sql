-- Connection Leak Workload
-- Simulates application connection leaks and long-running idle connections

\set user_id random(1, 100000)
\set product_id random(1, 500000)
\set sleep_time random(30, 120)

-- 40% - Long idle connections (simulating connection leaks)
SELECT 'Starting session for user: ' || :user_id;
SELECT pg_sleep(:sleep_time);
SELECT 'Session still active for user: ' || :user_id;
\sleep 10000ms

-- 25% - Connections that start transactions but don't commit quickly
BEGIN;
SELECT * FROM products WHERE id = :product_id;
SELECT pg_sleep(45 + random() * 30); -- 45-75 seconds
SELECT COUNT(*) FROM orders WHERE user_id = :user_id;
\sleep 15000ms
COMMIT;

-- 20% - Abandoned shopping cart sessions
BEGIN;
-- Simulate user browsing
SELECT id, name, price FROM products WHERE category_id = (random() * 10)::int + 1 LIMIT 5;
\sleep 5000ms

-- Add items to cart
INSERT INTO cart_items (user_id, product_id, quantity)
VALUES (:user_id, :product_id, (random() * 3)::int + 1);

-- User gets distracted, connection stays open
SELECT pg_sleep(60 + random() * 60); -- 1-2 minutes idle
\sleep 20000ms

-- Eventually times out or user leaves
ROLLBACK;

-- 10% - Long-running analytical queries holding connections
SELECT 
    p.category_id,
    COUNT(*) as product_count,
    AVG(p.price) as avg_price,
    SUM(CASE WHEN p.stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock
FROM products p
WHERE p.id % 1000 = (:product_id % 1000) -- Inefficient filtering
GROUP BY p.category_id
ORDER BY product_count DESC;

-- Simulate slow network or processing
SELECT pg_sleep(20 + random() * 40);

-- 5% - Connections in idle in transaction state
BEGIN;
SELECT 'Transaction started at: ' || NOW();
-- Simulate application hanging or network issues
SELECT pg_sleep(90 + random() * 30); -- 1.5-2 minutes
-- Transaction never commits, stays idle in transaction
-- COMMIT; -- Intentionally commented out to create idle transactions 