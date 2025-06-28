CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create e-commerce database schema
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Products catalog (will be populated with 500K items)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category_id INT REFERENCES categories(id),
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Order management
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Order line items
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    product_id INT REFERENCES products(id),
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

-- Shopping cart for session management
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    product_id INT REFERENCES products(id),
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Indexes (some intentionally missing for testing sequential scans)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

-- Missing indexes intentionally for testing:
-- products(name) - will cause seq scans on name searches
-- products(description) - will cause seq scans on description searches
-- orders(status) - will cause seq scans on status filtering

-- Generate sample categories
INSERT INTO categories (name, description) VALUES
    ('Electronics', 'Electronic devices and gadgets'),
    ('Clothing', 'Fashion and apparel'),
    ('Books', 'Books and literature'),
    ('Home & Garden', 'Home improvement and garden supplies'),
    ('Sports', 'Sports and outdoor equipment'),
    ('Toys', 'Toys and games'),
    ('Beauty', 'Beauty and personal care'),
    ('Automotive', 'Car parts and accessories'),
    ('Health', 'Health and wellness products'),
    ('Food', 'Food and beverages')
ON CONFLICT DO NOTHING;

-- Generate 100K users
INSERT INTO users (username, email)
SELECT
    'user_' || gs.id,
    'user_' || gs.id || '@shopfast.com'
FROM generate_series(1,100000) AS gs(id)
ON CONFLICT DO NOTHING;

-- Generate 500K products
INSERT INTO products (name, category_id, price, stock_quantity, description)
SELECT
    'Product ' || gs.id,
    (random() * 9)::int + 1, -- Random category 1-10
    (random() * 1000 + 10)::decimal(10,2), -- Price between $10-$1010
    (random() * 1000)::int, -- Stock 0-1000
    CASE 
        WHEN random() < 0.1 THEN 'Premium quality product with advanced features'
        WHEN random() < 0.3 THEN 'Best seller item with excellent reviews'
        ELSE 'Standard product description for item ' || gs.id
    END
FROM generate_series(1,500000) AS gs(id)
ON CONFLICT DO NOTHING;

-- Generate 1M orders (historical data)
INSERT INTO orders (user_id, total_amount, status, created_at)
SELECT
    (random() * 99999)::int + 1, -- Random user 1-100000
    (random() * 5000 + 10)::decimal(10,2), -- Order total $10-$5010
    CASE 
        WHEN random() < 0.8 THEN 'completed'
        WHEN random() < 0.95 THEN 'pending'
        ELSE 'cancelled'
    END,
    NOW() - (random() * interval '180 days') -- Orders from last 6 months
FROM generate_series(1,1000000) AS gs(id)
ON CONFLICT DO NOTHING;

-- Generate order items (2-5 items per order on average)
INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT
    o.id,
    (random() * 499999)::int + 1, -- Random product 1-500000
    (random() * 3)::int + 1, -- Quantity 1-4
    (random() * 500 + 5)::decimal(10,2) -- Item price $5-$505
FROM orders o
CROSS JOIN generate_series(1, (random() * 4)::int + 1) -- 1-5 items per order
ON CONFLICT DO NOTHING;

-- Create some active cart items for testing
INSERT INTO cart_items (user_id, product_id, quantity)
SELECT
    (random() * 99999)::int + 1, -- Random user 1-100000
    (random() * 499999)::int + 1, -- Random product 1-500000
    (random() * 5)::int + 1
FROM generate_series(1, 50000) -- 50K active cart items
ON CONFLICT DO NOTHING;

-- Update statistics for better query planning
ANALYZE;
