-- Product Search Workload
-- Simulates search-heavy traffic patterns

\set search_term random(1, 1000)
\set category_id random(1, 10)
\set price_min random(10, 500)
\set price_max random(501, 1000)

-- 40% - Text searches (sequential scans - missing index on name)
SELECT id, name, price, stock_quantity
FROM products 
WHERE name ILIKE '%' || :search_term || '%'
ORDER BY price
LIMIT 20;

-- 20% - Description searches (sequential scans - missing index)
SELECT id, name, description, price
FROM products 
WHERE description ILIKE '%premium%'
OR description ILIKE '%quality%'
LIMIT 15;

-- 15% - Complex filtering
SELECT p.id, p.name, p.price, c.name as category
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.price BETWEEN :price_min AND :price_max
AND p.stock_quantity > 0
ORDER BY p.price, p.name
LIMIT 25;

-- 10% - Popular search terms aggregation
SELECT 
    CASE 
        WHEN name ILIKE '%electronic%' THEN 'Electronics'
        WHEN name ILIKE '%book%' THEN 'Books'
        WHEN name ILIKE '%clothing%' THEN 'Clothing'
        ELSE 'Other'
    END as category_type,
    COUNT(*) as product_count,
    AVG(price) as avg_price
FROM products
GROUP BY category_type;

-- 10% - Search with sorting (expensive)
SELECT p.id, p.name, p.price,
       (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) as popularity
FROM products p
WHERE p.category_id = :category_id
ORDER BY popularity DESC, p.price ASC
LIMIT 30;

-- 5% - Search result counting (full table scan)
SELECT COUNT(*) FROM products 
WHERE name ILIKE '%Product%' 
AND price > :price_min; 