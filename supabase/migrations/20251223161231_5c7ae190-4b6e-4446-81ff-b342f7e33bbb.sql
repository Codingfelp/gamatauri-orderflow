-- Add user_id to orders to reliably associate orders to authenticated users
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Replace customer SELECT policy to prefer user_id, with legacy fallback to phone/email matching
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
ON public.orders
FOR SELECT
USING (
  (user_id IS NOT NULL AND auth.uid() = user_id)
  OR (
    user_id IS NULL
    AND (
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
    )
  )
);

-- Update order_items SELECT policy to follow orders.user_id first, then legacy fallback
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
ON public.order_items
FOR SELECT
USING (
  order_id IN (
    SELECT o.id
    FROM public.orders o
    WHERE (
      (o.user_id IS NOT NULL AND auth.uid() = o.user_id)
      OR (
        o.user_id IS NULL
        AND (
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
    )
  )
);
