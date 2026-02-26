-- =============================================================================
-- Zup Deliver — Schema Completo para Migração
-- Gerado em: 2026-02-26
-- Compatível com: Supabase / PostgreSQL 15+
-- =============================================================================

-- ─── ENUMS ──────────────────────────────────────────────────────────────────────

CREATE TYPE public.app_role AS ENUM ('admin', 'employee', 'customer');

-- ─── TABELAS ────────────────────────────────────────────────────────────────────

-- 1. products
CREATE TABLE public.products (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  description text,
  price       numeric     NOT NULL,
  image_url   text,
  category    text,
  available   boolean     DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT timezone('utc', now()),
  deleted_at  timestamptz
);

-- 2. orders
CREATE TABLE public.orders (
  id                       uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name            text        NOT NULL,
  customer_phone           text        NOT NULL,
  customer_email           text,
  customer_address         text,
  payment_method           text        NOT NULL,
  payment_timing           text        NOT NULL,
  payment_status           text        DEFAULT 'pendente',
  order_status             text        DEFAULT 'separacao',
  total_amount             numeric     NOT NULL,
  discount_amount          numeric     DEFAULT 0,
  delivery_type            text        DEFAULT 'delivery',
  change_for               text,
  notes                    text,
  coupon_id                uuid,
  user_id                  uuid,
  idempotency_key          text,
  external_order_number    text,
  stripe_payment_intent_id text,
  created_at               timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at               timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 3. order_items
CREATE TABLE public.order_items (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id      uuid        NOT NULL,
  product_id    uuid        NOT NULL,
  product_name  text        NOT NULL,
  product_price numeric     NOT NULL,
  quantity      integer     NOT NULL,
  subtotal      numeric     NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 4. profiles
CREATE TABLE public.profiles (
  id                uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid        NOT NULL UNIQUE,
  name              text        NOT NULL,
  email             text,
  phone             text,
  cpf               text,
  address           text,
  avatar_url        text,
  shipping_fee      numeric,
  favorite_products uuid[]      DEFAULT '{}'::uuid[],
  created_at        timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at        timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 5. user_addresses
CREATE TABLE public.user_addresses (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL,
  street       text        NOT NULL,
  number       text        NOT NULL,
  complement   text,
  neighborhood text        NOT NULL,
  city         text        NOT NULL,
  state        text        NOT NULL,
  distance_km  numeric     DEFAULT NULL,
  shipping_fee numeric,
  is_primary   boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 6. user_roles
CREATE TABLE public.user_roles (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL,
  role       app_role    NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 7. coupons
CREATE TABLE public.coupons (
  id             uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code           text        NOT NULL,
  description    text,
  discount_type  text        NOT NULL,
  discount_value numeric     NOT NULL DEFAULT 0,
  is_active      boolean     DEFAULT true,
  max_uses       integer,
  used_count     integer     DEFAULT 0,
  valid_from     timestamptz DEFAULT now(),
  valid_until    timestamptz,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- 8. coupon_usage
CREATE TABLE public.coupon_usage (
  id               uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id        uuid,
  user_id          uuid,
  order_id         uuid,
  discount_applied numeric     NOT NULL,
  used_at          timestamptz DEFAULT now()
);

-- 9. product_promotions
CREATE TABLE public.product_promotions (
  id                uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id        text        NOT NULL,
  promotional_price numeric     NOT NULL,
  original_price    numeric     NOT NULL,
  start_date        timestamptz NOT NULL,
  end_date          timestamptz NOT NULL,
  is_active         boolean     DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- 10. product_bundles
CREATE TABLE public.product_bundles (
  id                uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name              text        NOT NULL,
  description       text,
  product_ids       text[]      NOT NULL,
  quantity_required integer     NOT NULL DEFAULT 3,
  bundle_price      numeric     NOT NULL,
  is_active         boolean     NOT NULL DEFAULT true,
  start_date        timestamptz,
  end_date          timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- 11. product_custom_colors
CREATE TABLE public.product_custom_colors (
  id               uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name     text        NOT NULL,
  category         text,
  card_bg_color    text,
  card_text_color  text,
  modal_bg_color   text,
  modal_text_color text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- 12. push_subscriptions
CREATE TABLE public.push_subscriptions (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid,
  subscription jsonb       NOT NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- 13. store_settings
CREATE TABLE public.store_settings (
  id                     uuid    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_open                boolean NOT NULL DEFAULT true,
  is_raining             boolean NOT NULL DEFAULT false,
  opening_time           time    NOT NULL DEFAULT '10:00:00',
  closing_time           time    NOT NULL DEFAULT '23:00:00',
  max_delivery_radius_km numeric NOT NULL DEFAULT 5.0,
  min_delivery_fee       numeric NOT NULL DEFAULT 3.00,
  fee_per_km             numeric NOT NULL DEFAULT 3.00,
  rain_fee_per_km        numeric NOT NULL DEFAULT 5.00,
  closed_message         text    DEFAULT 'Estamos temporariamente fechados',
  closed_reason          text,
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- 14. user_recommendations
CREATE TABLE public.user_recommendations (
  id                     uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                uuid,
  top_recurrent_products jsonb       DEFAULT '[]'::jsonb,
  similar_products       jsonb       DEFAULT '[]'::jsonb,
  behavioral_products    jsonb       DEFAULT '[]'::jsonb,
  smart_combos           jsonb       DEFAULT '[]'::jsonb,
  favorite_categories    text[],
  last_purchase_date     timestamptz,
  total_orders           integer     DEFAULT 0,
  avg_ticket_value       numeric,
  cache_valid_until      timestamptz DEFAULT (now() + '24:00:00'::interval),
  updated_at             timestamptz DEFAULT now()
);

-- ─── FOREIGN KEYS ───────────────────────────────────────────────────────────────

ALTER TABLE public.orders
  ADD CONSTRAINT orders_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id);

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE public.coupon_usage
  ADD CONSTRAINT coupon_usage_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id);

ALTER TABLE public.coupon_usage
  ADD CONSTRAINT coupon_usage_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);

-- ─── DATABASE FUNCTIONS ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_user_id uuid, p_shipping_fee numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_order_count integer;
  v_discount numeric;
  v_usage_count integer;
BEGIN
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = p_code AND is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Cupom inválido ou expirado');
  END IF;
  
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < now() THEN
    RETURN json_build_object('valid', false, 'error', 'Cupom expirado');
  END IF;
  
  SELECT COUNT(*) INTO v_usage_count
  FROM coupon_usage
  WHERE coupon_id = v_coupon.id AND user_id = p_user_id;
  
  IF v_usage_count > 0 THEN
    RETURN json_build_object('valid', false, 'error', 'Você já usou este cupom');
  END IF;
  
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RETURN json_build_object('valid', false, 'error', 'Cupom esgotado');
  END IF;
  
  IF v_coupon.code = 'TAURIFRETEOFF' THEN
    SELECT COUNT(*) INTO v_order_count
    FROM orders
    WHERE customer_phone = (SELECT phone FROM profiles WHERE user_id = p_user_id);
    
    IF v_order_count > 0 THEN
      RETURN json_build_object('valid', false, 'error', 'Este cupom é apenas para primeiro pedido');
    END IF;
  END IF;
  
  IF v_coupon.discount_type = 'free_shipping' THEN
    v_discount := p_shipping_fee;
  ELSIF v_coupon.discount_type = 'percentage' THEN
    v_discount := (p_shipping_fee * v_coupon.discount_value / 100);
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;
  
  RETURN json_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'discount', v_discount,
    'description', v_coupon.description
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  existing_profile profiles;
BEGIN
  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE email = NEW.email
  LIMIT 1;
  
  IF FOUND THEN
    UPDATE public.profiles
    SET 
      user_id = NEW.id,
      name = COALESCE(existing_profile.name, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      updated_at = now()
    WHERE email = NEW.email;
  ELSE
    INSERT INTO public.profiles (user_id, name, email)
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
      ),
      NEW.email
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro em handle_new_user: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$function$;

-- ─── TRIGGERS ───────────────────────────────────────────────────────────────────

-- Trigger: auto-create profile on new auth user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── RLS (Row Level Security) ───────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_custom_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_recommendations ENABLE ROW LEVEL SECURITY;

-- products
CREATE POLICY "Todos podem visualizar produtos disponíveis" ON public.products
  FOR SELECT USING (available = true);

-- orders
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (is_admin());

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR (user_id IS NULL AND (
      (normalize_phone(customer_phone) <> '' AND normalize_phone(customer_phone) = normalize_phone((SELECT phone FROM profiles WHERE profiles.user_id = auth.uid())))
      OR (customer_email IS NOT NULL AND customer_email = (SELECT email FROM profiles WHERE profiles.user_id = auth.uid()))
    ))
  );

CREATE POLICY "Qualquer um pode criar pedidos" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Qualquer um pode atualizar status de pagamento" ON public.orders
  FOR UPDATE USING (true);

-- order_items
CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT USING (is_admin());

CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT o.id FROM orders o
      WHERE (o.user_id IS NOT NULL AND auth.uid() = o.user_id)
      OR (o.user_id IS NULL AND (
        (normalize_phone(o.customer_phone) <> '' AND normalize_phone(o.customer_phone) = normalize_phone((SELECT phone FROM profiles WHERE profiles.user_id = auth.uid())))
        OR (o.customer_email IS NOT NULL AND o.customer_email = (SELECT email FROM profiles WHERE profiles.user_id = auth.uid()))
      ))
    )
  );

CREATE POLICY "Qualquer um pode criar itens de pedido" ON public.order_items
  FOR INSERT WITH CHECK (true);

-- profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- user_addresses
CREATE POLICY "Users can view their own addresses" ON public.user_addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses" ON public.user_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" ON public.user_addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" ON public.user_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- user_roles
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- coupons
CREATE POLICY "Todos podem ler cupons ativos" ON public.coupons
  FOR SELECT USING (is_active = true);

-- coupon_usage
CREATE POLICY "Sistema pode inserir usos" ON public.coupon_usage
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários veem seus usos" ON public.coupon_usage
  FOR SELECT USING (auth.uid() = user_id);

-- product_promotions
CREATE POLICY "Promotions are viewable by everyone" ON public.product_promotions
  FOR SELECT USING (true);

-- product_bundles
CREATE POLICY "Admins can manage bundles" ON public.product_bundles
  FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view active bundles" ON public.product_bundles
  FOR SELECT USING (is_active = true);

-- product_custom_colors
CREATE POLICY "Anyone can view custom colors" ON public.product_custom_colors
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert colors" ON public.product_custom_colors
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update colors" ON public.product_custom_colors
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete colors" ON public.product_custom_colors
  FOR DELETE USING (is_admin());

-- push_subscriptions
CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- store_settings
CREATE POLICY "Todos podem ver status da loja" ON public.store_settings
  FOR SELECT USING (true);

-- user_recommendations
CREATE POLICY "Service role can manage recommendations" ON public.user_recommendations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can view own recommendations" ON public.user_recommendations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own recommendations" ON public.user_recommendations
  FOR SELECT USING (auth.uid() = user_id);
