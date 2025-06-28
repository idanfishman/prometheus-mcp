-- Purchase Attempts Workload
-- Simulates high-volume purchase attempts competing for inventory locks

\set product_id random(1, 1000)
\set user_id random(1, 100000)
\set quantity random(1, 5)

-- 50% - Standard purchase flow (competes with inventory updates)
BEGIN;
-- Check product availability
SELECT id, name, price, stock_quantity 
FROM products 
WHERE id = :product_id FOR SHARE;

-- Simulate user decision time
\sleep 1000ms

-- Attempt purchase
INSERT INTO orders (user_id, total_amount, status)
SELECT :user_id, price * :quantity, 'pending'
FROM products 
WHERE id = :product_id AND stock_quantity >= :quantity;

-- Update inventory if order created
UPDATE products 
SET stock_quantity = stock_quantity - :quantity
WHERE id = :product_id AND stock_quantity >= :quantity;
COMMIT;

-- 25% - Cart-based purchases (multiple products)
BEGIN;
-- Add to cart first
INSERT INTO cart_items (user_id, product_id, quantity)
VALUES (:user_id, :product_id, :quantity)
ON CONFLICT (user_id, product_id) DO UPDATE 
SET quantity = cart_items.quantity + :quantity;

-- Check total cart value
SELECT SUM(p.price * ci.quantity) as cart_total
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
WHERE ci.user_id = :user_id;

\sleep 500ms
COMMIT;

-- 15% - Failed purchases (insufficient stock)
BEGIN;
SELECT stock_quantity FROM products WHERE id = :product_id;
-- Attempt to buy more than available
UPDATE products 
SET stock_quantity = stock_quantity - (:quantity + 10)
WHERE id = :product_id AND stock_quantity >= (:quantity + 10);
-- This will often fail, causing rollbacks
COMMIT;

-- 10% - Checkout process (cart to order conversion)
BEGIN;
-- Lock user's cart items
SELECT ci.product_id, ci.quantity, p.price
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
WHERE ci.user_id = :user_id
FOR UPDATE;

\sleep 2000ms

-- Create order from cart
INSERT INTO orders (user_id, total_amount, status)
SELECT :user_id, SUM(p.price * ci.quantity), 'completed'
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
WHERE ci.user_id = :user_id;

-- Clear cart
DELETE FROM cart_items WHERE user_id = :user_id;
COMMIT; 