-- Expensive Analytics Workload
-- Simulates resource-intensive analytical queries

\set category_id random(1, 10)
\set days_back random(7, 90)

-- 30% - Sales analytics with complex joins (no proper indexes)
SELECT 
    p.name, 
    p.price, 
    COUNT(oi.id) as order_count,
    SUM(oi.quantity) as total_sold,
    SUM(oi.price * oi.quantity) as revenue
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE p.description LIKE '%premium%'
    AND o.created_at > NOW() - INTERVAL ':days_back days'
GROUP BY p.id, p.name, p.price
ORDER BY revenue DESC NULLS LAST
LIMIT 100;

-- 25% - Customer behavior analysis (sequential scans)
SELECT 
    u.id,
    u.username,
    COUNT(DISTINCT o.id) as total_orders,
    SUM(o.total_amount) as lifetime_value,
    AVG(o.total_amount) as avg_order_value,
    MAX(o.created_at) as last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.status = 'completed'
GROUP BY u.id, u.username
HAVING COUNT(o.id) > 5
ORDER BY lifetime_value DESC
LIMIT 50;

-- 20% - Inventory analysis with window functions
SELECT 
    p.id,
    p.name,
    p.stock_quantity,
    p.price,
    c.name as category,
    AVG(p.stock_quantity) OVER (PARTITION BY p.category_id) as avg_category_stock,
    RANK() OVER (PARTITION BY p.category_id ORDER BY p.stock_quantity DESC) as stock_rank,
    COUNT(*) OVER (PARTITION BY p.category_id) as category_product_count
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.stock_quantity < 50
ORDER BY p.category_id, stock_rank;

-- 15% - Product performance correlation (very expensive)
SELECT 
    p1.id as product1_id,
    p1.name as product1_name,
    p2.id as product2_id,
    p2.name as product2_name,
    COUNT(*) as times_bought_together
FROM order_items oi1
JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id < oi2.product_id
JOIN products p1 ON oi1.product_id = p1.id
JOIN products p2 ON oi2.product_id = p2.id
WHERE p1.category_id = :category_id OR p2.category_id = :category_id
GROUP BY p1.id, p1.name, p2.id, p2.name
HAVING COUNT(*) > 5
ORDER BY times_bought_together DESC
LIMIT 20;

-- 10% - Time-series analysis (full table scans)
SELECT 
    DATE_TRUNC('day', o.created_at) as order_date,
    COUNT(*) as daily_orders,
    SUM(o.total_amount) as daily_revenue,
    COUNT(DISTINCT o.user_id) as unique_customers,
    AVG(o.total_amount) as avg_order_value
FROM orders o
WHERE o.created_at > NOW() - INTERVAL ':days_back days'
    AND o.status IN ('completed', 'pending')
GROUP BY DATE_TRUNC('day', o.created_at)
ORDER BY order_date DESC; 