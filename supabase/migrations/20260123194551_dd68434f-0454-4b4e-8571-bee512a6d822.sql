-- Drop the existing unique constraint that doesn't handle NULLs properly
ALTER TABLE product_custom_colors DROP CONSTRAINT IF EXISTS product_custom_colors_product_name_category_key;

-- Create a unique index that treats NULLs as equals
CREATE UNIQUE INDEX product_custom_colors_unique_name_category 
ON product_custom_colors (product_name, COALESCE(category, ''));