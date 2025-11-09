-- Add deleted_at field to products table for tracking when products are removed
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance on available and deleted_at fields
CREATE INDEX IF NOT EXISTS idx_products_available_deleted 
ON products(available, deleted_at);