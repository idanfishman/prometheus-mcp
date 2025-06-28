-- Unoptimized Searches Workload
-- Simulates poorly optimized search queries causing performance issues

\set search_term random(1, 1000)
\set category_id random(1, 10)
\set user_id random(1, 100000)

-- 35% - Full-text searches without proper indexing
SELECT p.id, p.name, p.description, p.price
FROM products p
WHERE p.name ILIKE '%Product ' || :search_term || '%'
   OR p.description ILIKE '%' || :search_term || '%'
   OR p.description ILIKE '%quality%'
ORDER BY p.price DESC, p.name
LIMIT 50;

-- 20% - Inefficient substring matching
SELECT COUNT(*) as matching_products
FROM products 
WHERE LOWER(name) LIKE LOWER('%' || (SELECT name FROM categories WHERE id = :category_id) || '%')
   OR LOWER(description) LIKE LOWER('%' || (SELECT name FROM categories WHERE id = :category_id) || '%');

-- 15% - Complex filtering without proper indexes
SELECT p.id, p.name, p.price, o.order_count
FROM products p
LEFT JOIN (
    SELECT oi.product_id, COUNT(*) as order_count
    FROM order_items oi
    JOIN orders ord ON oi.order_id = ord.id
    WHERE ord.status = 'completed'
    GROUP BY oi.product_id
) o ON p.id = o.product_id
WHERE p.name LIKE '%' || :search_term || '%'
   AND p.stock_quantity > 0
   AND p.price BETWEEN 10 AND 1000
ORDER BY COALESCE(o.order_count, 0) DESC, p.price
LIMIT 30;

-- 15% - Inefficient user search patterns
SELECT DISTINCT p.id, p.name, p.price
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.user_id IN (
    SELECT DISTINCT user_id 
    FROM orders 
    WHERE total_amount > (
        SELECT AVG(total_amount) 
        FROM orders 
        WHERE status = 'completed'
    )
)
AND p.description LIKE '%premium%'
ORDER BY p.price DESC
LIMIT 25;

-- 10% - Regex-based searches (very expensive)
SELECT id, name, price
FROM products
WHERE name ~ '^Product [0-9]*' || :search_term || '[0-9]*$'
   OR description ~ '(premium|quality|best|top).*product'
LIMIT 20;

-- 5% - Cross-table searches without proper joins
SELECT 
    p.name as product_name,
    (SELECT COUNT(*) FROM order_items WHERE product_id = p.id) as times_ordered,
    (SELECT COUNT(*) FROM cart_items WHERE product_id = p.id) as times_in_cart,
    (SELECT AVG(total_amount) FROM orders WHERE id IN (
        SELECT order_id FROM order_items WHERE product_id = p.id
    )) as avg_order_value
FROM products p
WHERE p.category_id = :category_id
ORDER BY times_ordered DESC
LIMIT 15; 