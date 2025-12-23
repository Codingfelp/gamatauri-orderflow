-- Add idempotency_key column to orders table for duplicate prevention
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Create unique partial index (only for non-null keys)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key 
ON public.orders(idempotency_key) 
WHERE idempotency_key IS NOT NULL;