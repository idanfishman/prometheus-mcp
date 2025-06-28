-- Heavy Browsing Workload
-- Simulates increased traffic during promotional periods

\set product_id random(1, 500000)
\set user_id random(1, 100000)
\set category_id random(1, 10)
\set search_term random(1, 1000)

-- 30% - Product detail views with related products
SELECT * FROM products WHERE id = :product_id;
SELECT id, name, price FROM products 
WHERE category_id = (SELECT category_id FROM products WHERE id = :product_id)
AND id != :product_id
LIMIT 5;

-- 25% - Category browsing with pagination
SELECT p.id, p.name, p.price, p.stock_quantity
FROM products p 
WHERE p.category_id = :category_id 
ORDER BY p.price
LIMIT 50 OFFSET (random() * 100)::int;

-- 15% - Price comparison queries
SELECT category_id, AVG(price) as avg_price, MIN(price) as min_price, MAX(price) as max_price
FROM products 
WHERE category_id = :category_id
GROUP BY category_id;

-- 10% - Stock availability checks
SELECT COUNT(*) FROM products 
WHERE stock_quantity > 0 
AND category_id = :category_id;

-- 10% - User activity (cart + orders)
SELECT 
    (SELECT COUNT(*) FROM cart_items WHERE user_id = :user_id) as cart_items,
    (SELECT COUNT(*) FROM orders WHERE user_id = :user_id) as total_orders;

-- 10% - Search functionality (intentionally inefficient - missing index)
SELECT id, name, price FROM products 
WHERE name LIKE '%Product ' || :search_term || '%'
LIMIT 10; 