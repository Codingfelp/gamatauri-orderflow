# Substituindo Lovable Cloud por Supabase Externo

> Guia passo a passo para migrar o backend de Lovable Cloud para um Supabase independente.

---

## ⚠️ O que muda

| Aspecto | Lovable Cloud | Supabase Externo |
|---------|--------------|-----------------|
| Dashboard | Via Lovable (limitado) | Acesso completo em supabase.com |
| Edge Functions | Deploy automático | Deploy manual via CLI |
| Secrets | Via painel Lovable | Via dashboard Supabase ou CLI |
| Auth | Configurado via Lovable | Configurado no dashboard |
| Realtime | Automático | Precisa habilitar manualmente |

---

## 🚀 Passo 1: Criar Novo Projeto Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) e crie uma conta
2. Crie um novo projeto (escolha região próxima aos usuários)
3. Anote:
   - **Project URL**: `https://SEU_REF.supabase.co`
   - **Anon Key** (pública): `eyJ...`
   - **Service Role Key** (privada, NUNCA expor no frontend): `eyJ...`
   - **Project Ref**: a string curta tipo `abcdefghijklmnop`

---

## 🗃️ Passo 2: Criar Schema do Banco

1. No dashboard Supabase, vá em **SQL Editor**
2. Cole o conteúdo de `docs/migration/001_schema.sql`
3. Execute

Isso cria todas as 14 tabelas, RLS policies, functions e triggers.

---

## 📦 Passo 3: Exportar e Importar Dados

### Exportar dados do Lovable Cloud

Use uma destas opções:

**Opção A — Pela interface do app:**
1. Acesse `https://gamatauri-orderflow.lovable.app/data-export`
2. Clique em "Exportar JSON" para baixar todos os dados

**Opção B — Via curl (edge function):**
```bash
curl "https://lsxukelagellagzvjyuy.supabase.co/functions/v1/export-database?key=SUA_PRODUCTS_API_KEY" \
  -o database-export.json
```

### Importar no novo projeto

```javascript
// import-data.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient('NOVA_SUPABASE_URL', 'NOVA_SERVICE_ROLE_KEY');
const data = JSON.parse(fs.readFileSync('./database-export.json', 'utf-8'));

// Ordem de importação (respeitar foreign keys)
const importOrder = [
  'products',
  'coupons',
  'store_settings',
  'product_promotions',
  'product_bundles',
  'product_custom_colors',
  // Tabelas com user_id requerem auth users criados primeiro:
  // 'profiles', 'user_addresses', 'user_roles', 'push_subscriptions',
  // 'orders', 'order_items', 'coupon_usage', 'user_recommendations'
];

for (const table of importOrder) {
  const rows = data.data[table];
  if (!rows?.length) { console.log(`⏭️  ${table}: vazio`); continue; }

  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' });
    if (error) console.error(`❌ ${table} (lote ${i}):`, error.message);
    else console.log(`✅ ${table}: ${Math.min(i + 500, rows.length)}/${rows.length}`);
  }
}
```

---

## 🔌 Passo 4: Atualizar o Frontend

### 4.1 — Arquivo `.env`

Crie/atualize o `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://NOVO_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=NOVA_ANON_KEY
VITE_SUPABASE_PROJECT_ID=NOVO_REF
```

### 4.2 — Cliente Supabase

O arquivo `src/integrations/supabase/client.ts` lê as variáveis automaticamente. **Não precisa editar** — basta mudar o `.env`.

### 4.3 — Regenerar Types (opcional mas recomendado)

```bash
npx supabase gen types typescript --project-id NOVO_REF > src/integrations/supabase/types.ts
```

---

## ⚡ Passo 5: Deploy das Edge Functions

### Instalar Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref NOVO_REF
```

### Deploy de todas as functions

```bash
for fn in submit-order calculate-shipping fetch-products product-sync \
  store-status update-order-status manage-promotions sync-promotions \
  customer-api rain-status update-store-settings export-database \
  send-push-notification import-products-csv calculate-recommendations \
  retry-order; do
  supabase functions deploy $fn --no-verify-jwt
done
```

> Todas as functions usam `--no-verify-jwt` porque a autenticação é feita via headers de API key.

---

## 🔐 Passo 6: Configurar Secrets

No dashboard Supabase → **Settings → Edge Functions → Secrets**, adicione:

| Secret | Onde obter | Obrigatório |
|--------|-----------|-------------|
| `WEBHOOK_SECRET` | Defina uma string aleatória (ex: `openssl rand -hex 32`). Deve ser a **mesma** usada pelo sistema externo/ERP | ✅ |
| `EXTERNAL_SYSTEM_WEBHOOK_URL` | URL do endpoint `create-external-order` do seu sistema externo | Se integrar ERP |
| `EXTERNAL_ORDER_API_KEY` | API key que o sistema externo espera no header `x-api-key` | Se integrar ERP |
| `EXTERNAL_SYSTEM_WEBHOOK_SECRET` | Secret para validar chamadas do ERP → app | Se integrar ERP |
| `GOOGLE_DISTANCE_MATRIX_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/) → APIs → Distance Matrix | ✅ |
| `PRODUCTS_API_KEY` | Defina uma string aleatória para autenticar sync/export | ✅ |
| `CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/) → Credentials → OAuth 2.0 Client ID | ✅ (para login Google) |
| `CLIENT_SECRET_KEY` | Mesmo local do CLIENT_ID | ✅ (para login Google) |

### Via CLI (alternativa):

```bash
supabase secrets set WEBHOOK_SECRET="sua_chave_aqui"
supabase secrets set GOOGLE_DISTANCE_MATRIX_API_KEY="AIza..."
supabase secrets set PRODUCTS_API_KEY="sua_chave_aqui"
supabase secrets set CLIENT_ID="xxx.apps.googleusercontent.com"
supabase secrets set CLIENT_SECRET_KEY="GOCSPX-xxx"
# Se usar ERP:
supabase secrets set EXTERNAL_SYSTEM_WEBHOOK_URL="https://xxx.supabase.co/functions/v1/create-external-order"
supabase secrets set EXTERNAL_ORDER_API_KEY="chave_do_erp"
```

> ⚠️ `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_DB_URL` são preenchidos **automaticamente** pelo Supabase. Não precisa configurar.

---

## 🔑 Passo 7: Configurar Auth (Google OAuth)

1. No dashboard Supabase → **Authentication → Providers → Google**
2. Habilite e preencha:
   - **Client ID**: mesmo valor de `CLIENT_ID`
   - **Client Secret**: mesmo valor de `CLIENT_SECRET_KEY`
3. No [Google Cloud Console](https://console.cloud.google.com/) → Credentials → OAuth Client:
   - Adicione os **Redirect URIs**:
     ```
     https://NOVO_REF.supabase.co/auth/v1/callback
     ```
   - Adicione os **JavaScript Origins**:
     ```
     https://seudominio.com
     http://localhost:8080
     ```

---

## 📡 Passo 8: Habilitar Realtime

No dashboard Supabase → **Database → Replication**, habilite a tabela `store_settings`.

Ou via SQL Editor:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
```

---

## 🔄 Passo 9: Atualizar Integrações Externas

Se você usa um sistema externo (ERP/PDV), atualize as URLs lá:

| Fluxo | URL antiga (Lovable Cloud) | URL nova |
|-------|---------------------------|----------|
| Sync de produtos | `https://lsxukelagellagzvjyuy.supabase.co/functions/v1/product-sync` | `https://NOVO_REF.supabase.co/functions/v1/product-sync` |
| Status da loja | `https://lsxukelagellagzvjyuy.supabase.co/functions/v1/update-store-settings` | `https://NOVO_REF.supabase.co/functions/v1/update-store-settings` |

O header `x-api-key` deve conter o novo `WEBHOOK_SECRET`.

---

## ✅ Passo 10: Checklist de Validação

- [ ] `.env` atualizado com novas credenciais
- [ ] Schema SQL executado (14 tabelas)
- [ ] Dados importados (produtos, store_settings, coupons)
- [ ] Edge Functions deployadas (16 functions)
- [ ] Secrets configurados
- [ ] Auth Google funcionando (login + redirect)
- [ ] Realtime habilitado para `store_settings`
- [ ] URLs do ERP atualizadas para novo projeto
- [ ] App rodando localmente (`npm run dev`) sem erros
- [ ] Pedido de teste enviado com sucesso

---

## 🛡️ Segurança Pós-Migração

1. **RLS** já vem ativado pelo schema SQL — verifique no dashboard
2. **Nunca** exponha `service_role_key` no frontend
3. Mantenha secrets diferentes entre ambientes (dev/prod)
4. Rotacione o `WEBHOOK_SECRET` periodicamente

---

## 💡 Dicas

- Use `supabase db diff` para comparar schemas entre projetos
- Use `supabase functions serve` para testar Edge Functions localmente
- O app usa `VITE_SUPABASE_URL` nas chamadas de Edge Functions — tudo muda junto ao trocar o `.env`
