# Zup Deliver — Guia de Desenvolvimento Remoto

> Guia completo para configurar, rodar e fazer deploy deste projeto fora do Lovable.

---

## 📋 Visão Geral

| Item | Detalhe |
|------|---------|
| **Tipo** | PWA (Progressive Web App) de delivery |
| **Frontend** | React 18 + TypeScript + Vite 5 |
| **UI** | Tailwind CSS 3 + shadcn/ui + Radix UI + Framer Motion |
| **Backend** | Supabase (PostgreSQL + Edge Functions + Auth + Realtime) |
| **Push Notifications** | Firebase Cloud Messaging (FCM) |
| **Cálculo de frete** | Google Distance Matrix API |
| **Auth** | Google OAuth + Email/Password (via Supabase Auth) |

---

## 🛠️ Pré-requisitos

- **Node.js** >= 18 (recomendado: 20 LTS)
- **npm** ou **bun** (o projeto usa bun.lockb mas funciona com npm)
- **Supabase CLI** >= 1.150 (`npm install -g supabase`)
- **Git**

---

## 🚀 Setup Local

### 1. Clonar o repositório

```bash
git clone <URL_DO_REPO>
cd <NOME_DO_PROJETO>
```

### 2. Instalar dependências

```bash
npm install
# ou
bun install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...sua_anon_key
VITE_SUPABASE_PROJECT_ID=SEU_PROJECT_REF

# Firebase (Push Notifications) — opcional
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

> ⚠️ A `VITE_SUPABASE_PUBLISHABLE_KEY` é a **anon key** (pública). Nunca exponha a `service_role_key` no frontend.

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:8080`.

---

## 🗄️ Configuração do Supabase

### Criar projeto Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) e crie um novo projeto
2. Anote: **Project URL**, **Anon Key**, **Service Role Key** e **Project Ref**

### Aplicar schema do banco

Execute o arquivo `docs/migration/001_schema.sql` no **SQL Editor** do Supabase. Ele cria:

- 14 tabelas (products, orders, profiles, user_addresses, etc.)
- RLS policies para segurança
- Functions (validate_coupon, handle_new_user, is_admin, etc.)
- Triggers de atualização automática

### Importar dados (opcional)

Use `docs/data/database-export-2026-02-26.json` — veja instruções em `docs/migration/MIGRATION_GUIDE.md`.

### Deploy das Edge Functions

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF

# Deploy de todas as functions (todas sem JWT)
for fn in submit-order calculate-shipping fetch-products product-sync \
  store-status update-order-status manage-promotions sync-promotions \
  customer-api rain-status update-store-settings export-database \
  send-push-notification import-products-csv calculate-recommendations \
  retry-order; do
  supabase functions deploy $fn --no-verify-jwt
done
```

### Configurar Secrets no Supabase

Vá em **Settings → Edge Functions → Secrets**:

| Secret | Descrição | Obrigatório |
|--------|-----------|-------------|
| `WEBHOOK_SECRET` | Auth de webhooks internos (product-sync, store-settings) | ✅ |
| `EXTERNAL_SYSTEM_WEBHOOK_URL` | URL do ERP/PDV externo para enviar pedidos | Se integrar ERP |
| `EXTERNAL_SYSTEM_WEBHOOK_SECRET` | Secret para validar chamadas do ERP → app | Se integrar ERP |
| `EXTERNAL_ORDER_API_KEY` | API key enviada no header ao ERP | Se integrar ERP |
| `GOOGLE_DISTANCE_MATRIX_API_KEY` | Google Distance Matrix (cálculo de frete) | ✅ |
| `PRODUCTS_API_KEY` | Auth para sync/export de produtos | ✅ |
| `CLIENT_ID` | Google OAuth Client ID | ✅ |
| `CLIENT_SECRET_KEY` | Google OAuth Client Secret | ✅ |

> `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` são preenchidos automaticamente pelo Supabase.

### Configurar Auth

1. **Supabase Dashboard** → Authentication → Providers
2. Habilite **Google** com `CLIENT_ID` e `CLIENT_SECRET_KEY`
3. Configure redirect URLs: `https://SEU_DOMINIO.com`, `http://localhost:8080`

---

## 📁 Estrutura do Projeto

```
├── public/                  # Assets estáticos, PWA manifest, service worker
│   ├── manifest.json        # Configuração PWA
│   ├── sw.js                # Service Worker
│   └── fonts/               # Fontes SulSans
├── src/
│   ├── App.tsx              # Router principal
│   ├── main.tsx             # Entry point
│   ├── index.css            # Design tokens (CSS variables + Tailwind)
│   ├── assets/              # Imagens (categorias, promoções, marcas)
│   ├── components/          # Componentes React
│   │   ├── ui/              # shadcn/ui (Button, Dialog, Sheet, etc.)
│   │   └── product-modal/   # Modal de produto (mobile-first)
│   ├── contexts/            # React Contexts (ActiveOrder, StoreStatus, ColorEditor)
│   ├── config/              # Mapeamentos de categoria, push config
│   ├── data/                # JSON estáticos (productTags)
│   ├── hooks/               # Custom hooks (useAuth, usePromotions, useCart, etc.)
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts    # Cliente Supabase (auto-gerado)
│   │       └── types.ts     # Tipos TypeScript do banco (auto-gerado)
│   ├── lib/                 # Utilitários (cn/tailwind-merge)
│   ├── pages/               # Páginas (Index, Checkout, Orders, Profile, etc.)
│   ├── services/            # Serviços (products, orders, recommendations)
│   └── utils/               # Helpers (CPF, phone, address, search, share)
├── supabase/
│   ├── config.toml          # Config de Edge Functions (verify_jwt = false)
│   └── functions/           # 16 Edge Functions (Deno/TypeScript)
├── docs/
│   ├── migration/           # Schema SQL + guia de migração
│   ├── data/                # Export de dados
│   └── *.md                 # Documentação técnica
└── tailwind.config.ts       # Tema Tailwind customizado
```

---

## 🧩 Dependências Principais

| Pacote | Uso |
|--------|-----|
| `react` + `react-dom` | UI framework |
| `react-router-dom` | Roteamento SPA |
| `@supabase/supabase-js` | Cliente Supabase (DB, Auth, Realtime) |
| `@tanstack/react-query` | Cache e fetching de dados |
| `tailwindcss` + `tailwind-merge` | Estilização |
| `@radix-ui/*` | Componentes acessíveis (Dialog, Tabs, Select, etc.) |
| `framer-motion` | Animações |
| `react-hook-form` + `zod` | Formulários com validação |
| `embla-carousel-react` | Carrosséis |
| `recharts` | Gráficos |
| `sonner` | Toasts/notificações |
| `date-fns` | Manipulação de datas |
| `jspdf` + `html2canvas` | Geração de PDF (recibos) |
| `qrcode` | Geração de QR codes |

---

## 📜 Scripts Disponíveis

```bash
npm run dev        # Dev server (localhost:8080)
npm run build      # Build de produção
npm run build:dev  # Build em modo development
npm run preview    # Preview do build local
npm run lint       # ESLint
```

---

## 🏗️ Build & Deploy

### Build de produção

```bash
npm run build
```

Gera a pasta `dist/` com o app otimizado. O Vite já aplica:
- Code splitting (react-vendor, ui-vendor, form-vendor, supabase-vendor)
- Tree shaking
- Minificação via esbuild

### Deploy

O `dist/` é um site estático. Pode ser hospedado em:

#### Vercel
```bash
npm i -g vercel
vercel --prod
```

#### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Cloudflare Pages
Conecte o repo no dashboard do Cloudflare Pages:
- Build command: `npm run build`
- Output dir: `dist`

#### Nginx (VPS)
```nginx
server {
    listen 80;
    server_name seudominio.com;
    root /var/www/zup-deliver/dist;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache de assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

> ⚠️ Como é uma SPA, **todas** as rotas devem redirecionar para `/index.html`.

---

## 🔄 Fluxos de Integração

### Pedidos (App → ERP externo)
```
Cliente faz pedido → submit-order Edge Function → 
  1. Salva no banco (orders + order_items)
  2. POST para EXTERNAL_SYSTEM_WEBHOOK_URL com EXTERNAL_ORDER_API_KEY
```

### Sincronização de Produtos (ERP → App)
```
ERP chama POST /functions/v1/product-sync com header x-api-key: WEBHOOK_SECRET →
  Cria/atualiza/deleta produtos no banco
```

### Status da Loja (ERP → App)
```
ERP chama POST /functions/v1/update-store-settings com header x-api-key: WEBHOOK_SECRET →
  Atualiza is_open, is_raining, horários, taxas
```

---

## ⚡ Realtime

A tabela `store_settings` usa Supabase Realtime para atualizar o status da loja em tempo real no frontend. Certifique-se de que o Realtime está habilitado para essa tabela no dashboard do Supabase:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
```

---

## 🔐 Segurança

- **RLS (Row Level Security)** está habilitado em todas as tabelas
- Edge Functions usam `service_role_key` internamente para bypass de RLS quando necessário
- Todas as Edge Functions têm `verify_jwt = false` (autenticação via API key no header)
- Nunca exponha `service_role_key` no frontend

---

## 📱 PWA

O app é um PWA com:
- `public/manifest.json` — configuração do app
- `public/sw.js` — Service Worker para cache offline
- Ícones em `public/icons/` (72x72 até 512x512)

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| Erro de CORS nas Edge Functions | Verifique os `corsHeaders` no código da function |
| Auth Google não funciona | Verifique CLIENT_ID/CLIENT_SECRET_KEY nos Secrets + redirect URLs |
| Produtos não carregam | Verifique RLS da tabela products e se há dados com `deleted_at IS NULL` |
| Frete não calcula | Verifique GOOGLE_DISTANCE_MATRIX_API_KEY e se a API está habilitada no GCP |
| Pedido não chega no ERP | Verifique EXTERNAL_SYSTEM_WEBHOOK_URL e EXTERNAL_ORDER_API_KEY |

---

## 📚 Documentação Adicional

- `docs/database-schema.md` — Schema detalhado do banco
- `docs/migration/MIGRATION_GUIDE.md` — Guia completo de migração do Supabase
- `docs/PRODUCT_SYNC_API.md` — API de sincronização de produtos
- `docs/STORE_SETTINGS_WEBHOOK.md` — Webhook de configurações da loja
- `docs/CUSTOMER_FAVORITES_API.md` — API de favoritos
- `docs/GOOGLE_MAPS_TROUBLESHOOTING.md` — Debug do Google Maps

---

## 📝 Notas Importantes

1. **`src/integrations/supabase/types.ts`** — Gerado automaticamente pelo Supabase CLI. Para regenerar após mudanças no schema:
   ```bash
   supabase gen types typescript --project-id SEU_PROJECT_REF > src/integrations/supabase/types.ts
   ```

2. **Fontes customizadas** — O projeto usa a fonte SulSans (em `public/fonts/`), referenciada no `index.css`.

3. **Design System** — Cores e tokens estão em `src/index.css` (CSS variables HSL) e `tailwind.config.ts`. Nunca use cores hardcoded nos componentes.

4. **Edge Functions** — Escritas em Deno (TypeScript). Imports via URL (esm.sh). Testáveis localmente com `supabase functions serve`.
