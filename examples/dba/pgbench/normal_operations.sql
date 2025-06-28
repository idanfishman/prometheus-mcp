-- Normal Operations Workload
-- Simulates typical user browsing patterns during regular shopping

\set product_id random(1, 500000)
\set user_id random(1, 100000)
\set category_id random(1, 10)

-- 40% - Product detail views
SELECT * FROM products WHERE id = :product_id;

-- 20% - Category browsing
SELECT p.id, p.name, p.price, c.name as category 
FROM products p 
JOIN categories c ON p.category_id = c.id 
WHERE p.category_id = :category_id 
LIMIT 20;

-- 15% - User order history
SELECT COUNT(*) FROM orders WHERE user_id = :user_id;

-- 10% - Shopping cart check
SELECT ci.quantity, p.name, p.price 
FROM cart_items ci 
JOIN products p ON ci.product_id = p.id 
WHERE ci.user_id = :user_id;

-- 10% - Search by price range (uses index)
SELECT id, name, price FROM products 
WHERE price BETWEEN 50 AND 200 
AND category_id = :category_id 
LIMIT 10;

-- 5% - Popular products (completed orders)
SELECT p.name, COUNT(oi.id) as sales_count
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'completed'
AND p.category_id = :category_id
GROUP BY p.id, p.name
ORDER BY sales_count DESC
LIMIT 5; 