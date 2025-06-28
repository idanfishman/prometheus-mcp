-- Recovery Load Workload
-- Simulates normal operations during system recovery and stabilization

\set product_id random(1, 500000)
\set user_id random(1, 100000)
\set category_id random(1, 10)

-- 50% - Simple product lookups (efficient queries)
SELECT id, name, price, stock_quantity 
FROM products 
WHERE id = :product_id;

-- 20% - Category browsing with proper limits
SELECT p.id, p.name, p.price
FROM products p 
WHERE p.category_id = :category_id 
AND p.stock_quantity > 0
ORDER BY p.price
LIMIT 10;

-- 15% - User order history (indexed queries)
SELECT id, total_amount, status, created_at
FROM orders 
WHERE user_id = :user_id 
ORDER BY created_at DESC 
LIMIT 5;

-- 10% - Quick inventory checks
SELECT 
    category_id,
    COUNT(*) as available_products
FROM products 
WHERE stock_quantity > 0
GROUP BY category_id
ORDER BY category_id;

-- 5% - Simple cart operations
SELECT ci.quantity, p.name, p.price
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
WHERE ci.user_id = :user_id
LIMIT 10; 