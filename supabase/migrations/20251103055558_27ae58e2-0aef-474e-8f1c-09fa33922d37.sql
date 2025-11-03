-- Add external_order_number to orders table to store the external system's order ID
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS external_order_number TEXT;

-- Add phone and address columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- Create index on external_order_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_external_order_number ON public.orders(external_order_number);