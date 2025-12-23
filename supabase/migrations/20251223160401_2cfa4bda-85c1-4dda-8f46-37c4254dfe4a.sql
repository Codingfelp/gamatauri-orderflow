-- Normalize phone helper (digits-only)
CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT regexp_replace(COALESCE(p_phone, ''), '\\D', '', 'g');
$$;

-- Fix: Orders visibility for the customer (avoid formatted vs digits-only mismatch)
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
ON public.orders
FOR SELECT
USING (
  (
    public.normalize_phone(customer_phone) <> ''
    AND public.normalize_phone(customer_phone) = public.normalize_phone(
      (SELECT phone FROM public.profiles WHERE user_id = auth.uid())
    )
  )
  OR (
    customer_email IS NOT NULL
    AND customer_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Fix: Order items visibility based on the same matching rule
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
ON public.order_items
FOR SELECT
USING (
  order_id IN (
    SELECT o.id
    FROM public.orders o
    WHERE (
      (
        public.normalize_phone(o.customer_phone) <> ''
        AND public.normalize_phone(o.customer_phone) = public.normalize_phone(
          (SELECT phone FROM public.profiles WHERE user_id = auth.uid())
        )
      )
      OR (
        o.customer_email IS NOT NULL
        AND o.customer_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid())
      )
    )
  )
);

-- (Optional but safe) Keep admins policy untouched; only SELECT policies updated.
