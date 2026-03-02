# Zup Deliver — PWA de Delivery

App de delivery mobile-first construído com React + TypeScript + Supabase.

---

## 🏗️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS 3 |
| UI | shadcn/ui, Radix UI, Framer Motion |
| Backend | Supabase (PostgreSQL, Edge Functions, Auth, Realtime) |
| Push | Firebase Cloud Messaging |
| Frete | Google Distance Matrix API |
| Auth | Google OAuth + Email/Password (Supabase Auth) |

---

## 🚀 Setup Rápido

```bash
git clone <URL_DO_REPO>
cd <PASTA>
npm install
```

Crie `.env` na raiz:

```env
VITE_SUPABASE_URL=https://SEU_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_ANON_KEY
VITE_SUPABASE_PROJECT_ID=SEU_REF
```

```bash
npm run dev   # http://localhost:8080
```

---

## 📁 Estrutura

```
src/
├── pages/           # Rotas (Index, Checkout, Orders, Profile, Search, Auth...)
├── components/      # Componentes React
│   ├── ui/          # shadcn/ui (Button, Dialog, Sheet, etc.)
│   └── product-modal/
├── contexts/        # ActiveOrder, StoreStatus, ColorEditor
├── hooks/           # useAuth, usePromotions, useBundles, useRecommendations...
├── services/        # productsService, orderService, recommendationsService
├── utils/           # CPF, phone, address, search helpers
├── config/          # categoryMapping, pushConfig
├── integrations/
│   └── supabase/    # client.ts + types.ts (auto-gerados, NÃO editar)
└── index.css        # Design tokens (CSS variables HSL)

supabase/functions/  # 16 Edge Functions (Deno/TypeScript)
docs/                # Documentação técnica completa
```

---

## 🗄️ Banco de Dados

14 tabelas com RLS habilitado: `products`, `orders`, `order_items`, `profiles`, `user_addresses`, `user_roles`, `store_settings`, `coupons`, `coupon_usage`, `product_promotions`, `product_bundles`, `product_custom_colors`, `push_subscriptions`, `user_recommendations`.

### Aplicar schema num novo projeto

```bash
# No SQL Editor do Supabase, execute:
docs/migration/001_schema.sql
```

### Importar dados

```bash
# Gerar SQL a partir do JSON exportado
node docs/migration/convert-json-to-sql.cjs
# Depois execute o arquivo gerado (002_seed_data.sql) no SQL Editor
```

---

## ⚡ Edge Functions

Todas as 16 functions usam `--no-verify-jwt` (auth via API key no header).

| Function | Descrição |
|----------|-----------|
| `submit-order` | Cria pedido no banco + envia para ERP externo |
| `calculate-shipping` | Calcula frete via Google Distance Matrix |
| `fetch-products` | Lista produtos (com cache) |
| `product-sync` | Webhook: ERP → App (criar/atualizar/deletar produtos) |
| `store-status` | Retorna status atual da loja |
| `update-store-settings` | Webhook: ERP → App (horários, taxas, status) |
| `update-order-status` | Atualiza status de pedido existente |
| `manage-promotions` | CRUD de promoções |
| `sync-promotions` | Sincroniza promoções do ERP |
| `customer-api` | API de dados do cliente (favoritos, perfil) |
| `rain-status` | Consulta/atualiza status de chuva |
| `export-database` | Exporta todos os dados em JSON |
| `import-products-csv` | Importa produtos via CSV |
| `calculate-recommendations` | Gera recomendações personalizadas |
| `send-push-notification` | Envia push via FCM |
| `retry-order` | Reenvia pedido que falhou |

### Deploy

```bash
supabase login
supabase link --project-ref SEU_REF

for fn in submit-order calculate-shipping fetch-products product-sync \
  store-status update-order-status manage-promotions sync-promotions \
  customer-api rain-status update-store-settings export-database \
  send-push-notification import-products-csv calculate-recommendations \
  retry-order; do
  supabase functions deploy $fn --no-verify-jwt
done
```

---

## 🔐 Secrets Necessários

Configurar em **Supabase Dashboard → Settings → Edge Functions → Secrets**:

| Secret | Descrição |
|--------|-----------|
| `WEBHOOK_SECRET` | Valida webhooks de entrada (product-sync, store-settings) |
| `GOOGLE_DISTANCE_MATRIX_API_KEY` | Cálculo de frete |
| `PRODUCTS_API_KEY` | Auth para sync/export de produtos |
| `CLIENT_ID` | Google OAuth Client ID |
| `CLIENT_SECRET_KEY` | Google OAuth Client Secret |
| `EXTERNAL_SYSTEM_WEBHOOK_URL` | URL do ERP para enviar pedidos *(se integrar ERP)* |
| `EXTERNAL_ORDER_API_KEY` | API key do ERP *(se integrar ERP)* |
| `EXTERNAL_SYSTEM_WEBHOOK_SECRET` | Validação de chamadas ERP → app *(se integrar ERP)* |

> `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` são automáticos.

---

## 🔑 Auth (Google OAuth)

1. **Supabase Dashboard** → Authentication → Providers → Google
2. Preencha `CLIENT_ID` e `CLIENT_SECRET_KEY`
3. **Google Cloud Console** → Credentials → OAuth Client:
   - **Origens JavaScript autorizadas**: `https://SEU_REF.supabase.co`, `http://localhost:8080`
   - **URIs de redirecionamento**: `https://SEU_REF.supabase.co/auth/v1/callback`

---

## 🔄 Fluxos de Integração

```
📦 Pedidos:   Cliente → submit-order → banco + POST para ERP
📥 Produtos:  ERP → POST /product-sync (header x-api-key) → banco
🏪 Status:    ERP → POST /update-store-settings (header x-api-key) → banco → Realtime → app
```

### Realtime

A tabela `store_settings` usa Supabase Realtime:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
```

---

## 📜 Scripts

```bash
npm run dev        # Dev server (localhost:8080)
npm run build      # Build de produção
npm run preview    # Preview do build
npm run lint       # ESLint
```

---

## 🏗️ Build & Deploy

```bash
npm run build      # Gera dist/
```

A pasta `dist/` é um site estático. Deploy em Vercel, Netlify, Cloudflare Pages ou qualquer servidor com redirect de SPA (`try_files $uri /index.html`).

---

## 📱 PWA

- `public/manifest.json` — config do app
- `public/sw.js` — Service Worker (cache offline)
- `public/icons/` — ícones 72x72 até 512x512
- Fontes customizadas SulSans em `public/fonts/`

---

## 🧩 Dependências Principais

| Pacote | Uso |
|--------|-----|
| `@supabase/supabase-js` | Cliente Supabase |
| `@tanstack/react-query` | Cache e fetching |
| `framer-motion` | Animações |
| `react-hook-form` + `zod` | Formulários + validação |
| `embla-carousel-react` | Carrosséis |
| `recharts` | Gráficos |
| `jspdf` + `html2canvas` | PDF de recibos |
| `sonner` | Toasts |

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| CORS nas Edge Functions | Verificar `corsHeaders` no código da function |
| Google Auth não funciona | Verificar CLIENT_ID/CLIENT_SECRET + redirect URLs |
| Produtos não carregam | Verificar RLS + `deleted_at IS NULL` |
| Frete não calcula | Verificar GOOGLE_DISTANCE_MATRIX_API_KEY |
| Pedido não chega no ERP | Verificar EXTERNAL_SYSTEM_WEBHOOK_URL + API_KEY |

---

## 📚 Documentação Detalhada

- [`docs/DEVELOPER_HANDOFF.md`](docs/DEVELOPER_HANDOFF.md) — Guia completo de desenvolvimento
- [`docs/REPLACING_LOVABLE_CLOUD.md`](docs/REPLACING_LOVABLE_CLOUD.md) — Migração para Supabase externo
- [`docs/migration/MIGRATION_GUIDE.md`](docs/migration/MIGRATION_GUIDE.md) — Schema + importação de dados
- [`docs/PRODUCT_SYNC_API.md`](docs/PRODUCT_SYNC_API.md) — API de sincronização de produtos
- [`docs/STORE_SETTINGS_WEBHOOK.md`](docs/STORE_SETTINGS_WEBHOOK.md) — Webhook de config da loja
- [`docs/CUSTOMER_FAVORITES_API.md`](docs/CUSTOMER_FAVORITES_API.md) — API de favoritos
- [`docs/database-schema.md`](docs/database-schema.md) — Schema detalhado do banco

---

## ⚠️ Regras Importantes

1. **Nunca edite** `src/integrations/supabase/client.ts` ou `types.ts` — são auto-gerados
2. **Nunca exponha** `service_role_key` no frontend
3. **Design System** — use CSS variables HSL de `index.css`, nunca cores hardcoded
4. **Regenerar types** após mudar schema: `supabase gen types typescript --project-id REF > src/integrations/supabase/types.ts`
