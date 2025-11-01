-- Remove foreign key constraint from order_items.product_id
-- This allows storing external product IDs that don't exist in the local products table
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;