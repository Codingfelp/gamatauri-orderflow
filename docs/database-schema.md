# Database Schema — Zup Deliver

> Gerado em: 2026-02-26  
> Banco: PostgreSQL (Lovable Cloud)  
> Projeto: `lsxukelagellagzvjyuy`

---

## Enums

### `app_role`
| Value      |
|------------|
| admin      |
| employee   |
| customer   |

---

## Tabelas

### `products`
| Coluna      | Tipo                     | Nullable | Default                          |
|-------------|--------------------------|----------|----------------------------------|
| id          | uuid                     | No       | gen_random_uuid()                |
| name        | text                     | No       | —                                |
| description | text                     | Yes      | —                                |
| price       | numeric                  | No       | —                                |
| image_url   | text                     | Yes      | —                                |
| category    | text                     | Yes      | —                                |
| available   | boolean                  | Yes      | true                             |
| created_at  | timestamptz              | No       | timezone('utc', now())           |
| deleted_at  | timestamptz              | Yes      | —                                |

**RLS:**
- SELECT: `available = true` (todos podem ver produtos disponíveis)
- INSERT/UPDATE/DELETE: bloqueado

---

### `orders`
| Coluna                    | Tipo        | Nullable | Default                  |
|---------------------------|-------------|----------|--------------------------|
| id                        | uuid        | No       | gen_random_uuid()        |
| customer_name             | text        | No       | —                        |
| customer_phone            | text        | No       | —                        |
| customer_email            | text        | Yes      | —                        |
| customer_address          | text        | Yes      | —                        |
| payment_method            | text        | No       | —                        |
| payment_timing            | text        | No       | —                        |
| payment_status            | text        | Yes      | 'pendente'               |
| order_status              | text        | Yes      | 'separacao'              |
| total_amount              | numeric     | No       | —                        |
| discount_amount           | numeric     | Yes      | 0                        |
| delivery_type             | text        | Yes      | 'delivery'               |
| change_for                | text        | Yes      | —                        |
| notes                     | text        | Yes      | —                        |
| coupon_id                 | uuid        | Yes      | —                        |
| user_id                   | uuid        | Yes      | —                        |
| idempotency_key           | text        | Yes      | —                        |
| external_order_number     | text        | Yes      | —                        |
| stripe_payment_intent_id  | text        | Yes      | —                        |
| created_at                | timestamptz | No       | timezone('utc', now())   |
| updated_at                | timestamptz | No       | timezone('utc', now())   |

**FK:** `coupon_id → coupons.id`

**RLS:**
- SELECT (admin): `is_admin()`
- SELECT (user): match por `user_id`, `customer_phone` ou `customer_email`
- INSERT: público (`true`)
- UPDATE: público (`true`) — para atualização de status de pagamento
- DELETE: bloqueado

---

### `order_items`
| Coluna        | Tipo        | Nullable | Default                |
|---------------|-------------|----------|------------------------|
| id            | uuid        | No       | gen_random_uuid()      |
| order_id      | uuid        | No       | —                      |
| product_id    | uuid        | No       | —                      |
| product_name  | text        | No       | —                      |
| product_price | numeric     | No       | —                      |
| quantity      | integer     | No       | —                      |
| subtotal      | numeric     | No       | —                      |
| created_at    | timestamptz | No       | timezone('utc', now()) |

**FK:** `order_id → orders.id`

**RLS:**
- SELECT (admin): `is_admin()`
- SELECT (user): itens de pedidos do próprio usuário
- INSERT: público (`true`)
- UPDATE/DELETE: bloqueado

---

### `profiles`
| Coluna            | Tipo        | Nullable | Default                |
|-------------------|-------------|----------|------------------------|
| id                | uuid        | No       | gen_random_uuid()      |
| user_id           | uuid        | No       | —                      |
| name              | text        | No       | —                      |
| email             | text        | Yes      | —                      |
| phone             | text        | Yes      | —                      |
| cpf               | text        | Yes      | —                      |
| address           | text        | Yes      | —                      |
| avatar_url        | text        | Yes      | —                      |
| shipping_fee      | numeric     | Yes      | —                      |
| favorite_products | uuid[]      | Yes      | '{}'::uuid[]           |
| created_at        | timestamptz | No       | timezone('utc', now()) |
| updated_at        | timestamptz | No       | timezone('utc', now()) |

**RLS:**
- SELECT/INSERT/UPDATE: `auth.uid() = user_id`
- DELETE: bloqueado

---

### `user_addresses`
| Coluna       | Tipo        | Nullable | Default           |
|--------------|-------------|----------|-------------------|
| id           | uuid        | No       | gen_random_uuid() |
| user_id      | uuid        | No       | —                 |
| street       | text        | No       | —                 |
| number       | text        | No       | —                 |
| complement   | text        | Yes      | —                 |
| neighborhood | text        | No       | —                 |
| city         | text        | No       | —                 |
| state        | text        | No       | —                 |
| distance_km  | numeric     | Yes      | —                 |
| shipping_fee | numeric     | Yes      | —                 |
| is_primary   | boolean     | No       | false             |
| created_at   | timestamptz | No       | now()             |
| updated_at   | timestamptz | No       | now()             |

**RLS:** SELECT/INSERT/UPDATE/DELETE: `auth.uid() = user_id`

---

### `user_roles`
| Coluna     | Tipo        | Nullable | Default                |
|------------|-------------|----------|------------------------|
| id         | uuid        | No       | gen_random_uuid()      |
| user_id    | uuid        | No       | —                      |
| role       | app_role    | No       | —                      |
| created_at | timestamptz | No       | timezone('utc', now()) |

**RLS:**
- ALL/SELECT (admin): `has_role(auth.uid(), 'admin')`
- SELECT (user): `auth.uid() = user_id`

---

### `coupons`
| Coluna         | Tipo        | Nullable | Default           |
|----------------|-------------|----------|-------------------|
| id             | uuid        | No       | gen_random_uuid() |
| code           | text        | No       | —                 |
| description    | text        | Yes      | —                 |
| discount_type  | text        | No       | —                 |
| discount_value | numeric     | No       | 0                 |
| is_active      | boolean     | Yes      | true              |
| max_uses       | integer     | Yes      | —                 |
| used_count     | integer     | Yes      | 0                 |
| valid_from     | timestamptz | Yes      | now()             |
| valid_until    | timestamptz | Yes      | —                 |
| created_at     | timestamptz | Yes      | now()             |
| updated_at     | timestamptz | Yes      | now()             |

**RLS:** SELECT: `is_active = true`

---

### `coupon_usage`
| Coluna           | Tipo        | Nullable | Default           |
|------------------|-------------|----------|-------------------|
| id               | uuid        | No       | gen_random_uuid() |
| coupon_id        | uuid        | Yes      | —                 |
| user_id          | uuid        | Yes      | —                 |
| order_id         | uuid        | Yes      | —                 |
| discount_applied | numeric     | No       | —                 |
| used_at          | timestamptz | Yes      | now()             |

**FK:** `coupon_id → coupons.id`, `order_id → orders.id`

**RLS:**
- INSERT: público
- SELECT: `auth.uid() = user_id`

---

### `product_promotions`
| Coluna            | Tipo        | Nullable | Default           |
|-------------------|-------------|----------|-------------------|
| id                | uuid        | No       | gen_random_uuid() |
| product_id        | text        | No       | —                 |
| promotional_price | numeric     | No       | —                 |
| original_price    | numeric     | No       | —                 |
| start_date        | timestamptz | No       | —                 |
| end_date          | timestamptz | No       | —                 |
| is_active         | boolean     | Yes      | true              |
| created_at        | timestamptz | No       | now()             |
| updated_at        | timestamptz | No       | now()             |

**RLS:** SELECT: público (`true`)

---

### `product_bundles`
| Coluna            | Tipo        | Nullable | Default           |
|-------------------|-------------|----------|-------------------|
| id                | uuid        | No       | gen_random_uuid() |
| name              | text        | No       | —                 |
| description       | text        | Yes      | —                 |
| product_ids       | text[]      | No       | —                 |
| quantity_required | integer     | No       | 3                 |
| bundle_price      | numeric     | No       | —                 |
| is_active         | boolean     | No       | true              |
| start_date        | timestamptz | Yes      | —                 |
| end_date          | timestamptz | Yes      | —                 |
| created_at        | timestamptz | No       | now()             |
| updated_at        | timestamptz | No       | now()             |

**RLS:**
- ALL (admin): `is_admin()`
- SELECT: `is_active = true`

---

### `product_custom_colors`
| Coluna           | Tipo        | Nullable | Default           |
|------------------|-------------|----------|-------------------|
| id               | uuid        | No       | gen_random_uuid() |
| product_name     | text        | No       | —                 |
| category         | text        | Yes      | —                 |
| card_bg_color    | text        | Yes      | —                 |
| card_text_color  | text        | Yes      | —                 |
| modal_bg_color   | text        | Yes      | —                 |
| modal_text_color | text        | Yes      | —                 |
| created_at       | timestamptz | No       | now()             |
| updated_at       | timestamptz | No       | now()             |

**RLS:**
- SELECT: público
- INSERT/UPDATE/DELETE: `is_admin()`

---

### `push_subscriptions`
| Coluna       | Tipo        | Nullable | Default           |
|--------------|-------------|----------|-------------------|
| id           | uuid        | No       | gen_random_uuid() |
| user_id      | uuid        | Yes      | —                 |
| subscription | jsonb       | No       | —                 |
| created_at   | timestamptz | Yes      | now()             |
| updated_at   | timestamptz | Yes      | now()             |

**RLS:** ALL: `auth.uid() = user_id`

---

### `store_settings`
| Coluna                 | Tipo    | Nullable | Default                             |
|------------------------|---------|----------|-------------------------------------|
| id                     | uuid    | No       | gen_random_uuid()                   |
| is_open                | boolean | No       | true                                |
| is_raining             | boolean | No       | false                               |
| opening_time           | time    | No       | '10:00:00'                          |
| closing_time           | time    | No       | '23:00:00'                          |
| max_delivery_radius_km | numeric | No       | 5.0                                 |
| min_delivery_fee       | numeric | No       | 3.00                                |
| fee_per_km             | numeric | No       | 3.00                                |
| rain_fee_per_km        | numeric | No       | 5.00                                |
| closed_message         | text    | Yes      | 'Estamos temporariamente fechados'  |
| closed_reason          | text    | Yes      | —                                   |
| updated_at             | timestamptz | No   | now()                               |

**RLS:** SELECT: público

---

### `user_recommendations`
| Coluna               | Tipo        | Nullable | Default              |
|----------------------|-------------|----------|----------------------|
| id                   | uuid        | No       | gen_random_uuid()    |
| user_id              | uuid        | Yes      | —                    |
| top_recurrent_products | jsonb     | Yes      | '[]'::jsonb          |
| similar_products     | jsonb       | Yes      | '[]'::jsonb          |
| behavioral_products  | jsonb       | Yes      | '[]'::jsonb          |
| smart_combos         | jsonb       | Yes      | '[]'::jsonb          |
| favorite_categories  | text[]      | Yes      | —                    |
| last_purchase_date   | timestamptz | Yes      | —                    |
| total_orders         | integer     | Yes      | 0                    |
| avg_ticket_value     | numeric     | Yes      | —                    |
| cache_valid_until    | timestamptz | Yes      | now() + '24h'        |
| updated_at           | timestamptz | Yes      | now()                |

**RLS:**
- ALL (service): público
- SELECT (user): `auth.uid() = user_id`

---

## Database Functions

### `is_admin() → boolean`
Verifica se o usuário autenticado possui role `admin` em `user_roles`. `SECURITY DEFINER`.

### `has_role(_user_id uuid, _role app_role) → boolean`
Verifica se um usuário específico possui uma role. `SECURITY DEFINER`.

### `handle_new_user() → trigger`
Trigger executado após criação de usuário no auth. Cria perfil em `profiles` e atribui role `customer`. Se o e-mail já existe, vincula ao perfil existente. `SECURITY DEFINER`.

### `normalize_phone(p_phone text) → text`
Remove caracteres não-numéricos de telefone. `IMMUTABLE`.

### `validate_coupon(p_code text, p_user_id uuid, p_shipping_fee numeric) → json`
Valida cupom de desconto. Verifica: existência, expiração, uso prévio, limite de usos, primeira compra. `SECURITY DEFINER`.

### `handle_updated_at() → trigger`
Atualiza coluna `updated_at` para UTC now. `SECURITY DEFINER`.

### `update_updated_at_column() → trigger`
Similar ao `handle_updated_at`, atualiza `updated_at` para `now()`.

---

## Edge Functions

| Função                    | JWT   | Descrição                                    |
|---------------------------|-------|----------------------------------------------|
| submit-order              | false | Cria pedido e envia ao sistema externo       |
| calculate-shipping        | false | Calcula frete via Google Distance Matrix     |
| fetch-products            | false | Busca produtos (cache + API externa)         |
| product-sync              | false | Sincroniza produtos com API externa          |
| store-status              | false | Retorna status da loja                       |
| update-order-status       | false | Webhook para atualizar status do pedido      |
| manage-promotions         | false | CRUD de promoções                            |
| sync-promotions           | false | Sincroniza promoções                         |
| customer-api              | false | API de clientes (favoritos, etc.)            |
| rain-status               | false | Webhook para status de chuva                 |
| update-store-settings     | false | Webhook para configurações da loja           |
| export-database           | false | Exportação completa do banco via API key     |

---

## Secrets Configurados

| Nome                           | Uso                                      |
|--------------------------------|------------------------------------------|
| WEBHOOK_SECRET                 | Autenticação de webhooks internos        |
| EXTERNAL_SYSTEM_WEBHOOK_URL    | URL do sistema externo (ERP/PDV)         |
| EXTERNAL_SYSTEM_WEBHOOK_SECRET | Secret para webhooks do sistema externo  |
| EXTERNAL_ORDER_API_KEY         | API key para pedidos externos            |
| GOOGLE_DISTANCE_MATRIX_API_KEY | Google Distance Matrix API               |
| PRODUCTS_API_KEY               | API key para sync/export de produtos     |
| LOVABLE_API_KEY                | API key do Lovable AI                    |
| CLIENT_ID / CLIENT_SECRET_KEY  | Credenciais OAuth                        |
| SUPABASE_SERVICE_ROLE_KEY      | Service role (acesso total ao banco)     |
