# Guia de Migração — Zup Deliver

> Última atualização: 2026-02-26  
> Este guia permite recriar o banco de dados completo em um novo projeto Supabase.

---

## 📁 Estrutura dos Arquivos

```
docs/
├── migration/
│   ├── MIGRATION_GUIDE.md          ← Este arquivo
│   ├── 001_schema.sql              ← Schema completo (tabelas, RLS, functions, triggers)
│   └── convert-json-to-sql.cjs    ← Script que gera 002_seed_data.sql a partir do JSON
├── data/
│   └── database-export-2026-02-26.json  ← Dados exportados de todas as tabelas
└── database-schema.md              ← Documentação de referência do schema
```

---

## 🚀 Passo 1: Criar Projeto Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Crie um novo projeto
3. Anote: **Project URL**, **Anon Key** e **Service Role Key**

---

## 🗃️ Passo 2: Executar Schema SQL

1. Vá em **SQL Editor** no dashboard do Supabase
2. Cole o conteúdo de `docs/migration/001_schema.sql`
3. Execute

> ⚠️ O trigger `on_auth_user_created` requer que o schema `auth` já exista (padrão no Supabase).

---

## 📦 Passo 3: Importar Dados

Use o arquivo `docs/data/database-export-2026-02-26.json` para importar os dados.

### Opção A: Gerar SQL e executar (RECOMENDADO)

```bash
# Na raiz do projeto, gere o arquivo SQL a partir do JSON:
node docs/migration/convert-json-to-sql.cjs

# Isso gera: docs/migration/002_seed_data.sql
# Cole no SQL Editor do Supabase e execute.
```

O script gera INSERTs com `ON CONFLICT (id) DO NOTHING` — é seguro rodar múltiplas vezes.

### Opção B: Via Script Node.js (upsert via SDK)

```javascript
// import-data.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'SUA_SUPABASE_URL',
  'SUA_SERVICE_ROLE_KEY'
);

const data = JSON.parse(fs.readFileSync('./docs/data/database-export-2026-02-26.json', 'utf-8'));

// Ordem de importação (respeitar foreign keys)
const importOrder = [
  'products',
  'coupons',
  'store_settings',
  'product_promotions',
  'product_bundles',
  'product_custom_colors',
  // Tabelas com user_id (precisam de auth users criados primeiro):
  // 'profiles', 'user_addresses', 'user_roles', 'push_subscriptions',
  // 'orders', 'order_items', 'coupon_usage', 'user_recommendations'
];

for (const table of importOrder) {
  const rows = data.data[table];
  if (!rows || rows.length === 0) {
    console.log(`⏭️  ${table}: vazio`);
    continue;
  }

  // Inserir em lotes de 500
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`❌ ${table} (lote ${i}):`, error.message);
    } else {
      console.log(`✅ ${table}: ${Math.min(i + 500, rows.length)}/${rows.length}`);
    }
  }
}
```

### Opção C: Via SQL Editor (tabelas menores)

Para tabelas pequenas como `store_settings` e `coupons`, copie os dados do JSON e faça INSERT direto no SQL Editor.

---

## ⚡ Passo 4: Deploy das Edge Functions

Copie a pasta `supabase/functions/` para o novo projeto.

### Lista de Edge Functions:

| Função                      | Arquivo                                         | JWT  |
|-----------------------------|------------------------------------------------|------|
| submit-order                | supabase/functions/submit-order/index.ts       | false |
| calculate-shipping          | supabase/functions/calculate-shipping/index.ts | false |
| fetch-products              | supabase/functions/fetch-products/index.ts     | false |
| product-sync                | supabase/functions/product-sync/index.ts       | false |
| store-status                | supabase/functions/store-status/index.ts       | false |
| update-order-status         | supabase/functions/update-order-status/index.ts| false |
| manage-promotions           | supabase/functions/manage-promotions/index.ts  | false |
| sync-promotions             | supabase/functions/sync-promotions/index.ts    | false |
| customer-api                | supabase/functions/customer-api/index.ts       | false |
| rain-status                 | supabase/functions/rain-status/index.ts        | false |
| update-store-settings       | supabase/functions/update-store-settings/index.ts | false |
| export-database             | supabase/functions/export-database/index.ts    | false |
| send-push-notification      | supabase/functions/send-push-notification/index.ts | false |
| import-products-csv         | supabase/functions/import-products-csv/index.ts | false |
| calculate-recommendations   | supabase/functions/calculate-recommendations/index.ts | false |

### Deploy via CLI:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy submit-order --no-verify-jwt
supabase functions deploy calculate-shipping --no-verify-jwt
supabase functions deploy fetch-products --no-verify-jwt
supabase functions deploy product-sync --no-verify-jwt
supabase functions deploy store-status --no-verify-jwt
supabase functions deploy update-order-status --no-verify-jwt
supabase functions deploy manage-promotions --no-verify-jwt
supabase functions deploy sync-promotions --no-verify-jwt
supabase functions deploy customer-api --no-verify-jwt
supabase functions deploy rain-status --no-verify-jwt
supabase functions deploy update-store-settings --no-verify-jwt
supabase functions deploy export-database --no-verify-jwt
supabase functions deploy send-push-notification --no-verify-jwt
supabase functions deploy import-products-csv --no-verify-jwt
supabase functions deploy calculate-recommendations --no-verify-jwt
```

---

## 🔐 Passo 5: Configurar Secrets

Vá em **Settings → Edge Functions → Secrets** no Supabase e adicione:

| Secret                         | Descrição                                    |
|--------------------------------|----------------------------------------------|
| WEBHOOK_SECRET                 | Autenticação de webhooks internos            |
| EXTERNAL_SYSTEM_WEBHOOK_URL    | URL do sistema externo (ERP/PDV)             |
| EXTERNAL_SYSTEM_WEBHOOK_SECRET | Secret para webhooks do sistema externo      |
| EXTERNAL_ORDER_API_KEY         | API key para pedidos externos                |
| GOOGLE_DISTANCE_MATRIX_API_KEY | Google Distance Matrix API                   |
| PRODUCTS_API_KEY               | API key para sync/export de produtos         |
| CLIENT_ID                      | OAuth Client ID (Google)                     |
| CLIENT_SECRET_KEY              | OAuth Client Secret (Google)                 |

> ⚠️ `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são preenchidos automaticamente pelo Supabase.

---

## 🔑 Passo 6: Configurar Auth

1. Vá em **Authentication → Providers** no Supabase
2. Habilite **Google** com CLIENT_ID e CLIENT_SECRET_KEY
3. Configure os redirect URLs conforme seu domínio

---

## ✅ Passo 7: Validação

Após a migração, verifique:

- [ ] Tabelas criadas (14 tabelas)
- [ ] Dados dos produtos importados (~250+ produtos)
- [ ] Store settings com valores padrão
- [ ] Edge Functions deployadas e respondendo
- [ ] Secrets configurados
- [ ] Auth Google funcionando
- [ ] RLS policies ativas (testar com anon key e auth key)

---

## ⚠️ O que NÃO é migrado automaticamente

| Item                  | Ação necessária                              |
|-----------------------|----------------------------------------------|
| Auth users            | Usuários precisam se recadastrar             |
| Storage buckets       | Imagens precisam ser baixadas separadamente  |
| Secrets/API keys      | Devem ser reconfigurados manualmente         |
| Realtime subscriptions| Reconfigurar publicações se necessário       |

---

## 📊 Resumo das Tabelas

| Tabela                | Registros (aprox.) | Dados sensíveis |
|-----------------------|-------------------|-----------------|
| products              | ~250              | Não             |
| orders                | Variável          | Sim (PII)       |
| order_items           | Variável          | Não             |
| profiles              | Variável          | Sim (PII)       |
| user_addresses        | Variável          | Sim (PII)       |
| user_roles            | Variável          | Não             |
| coupons               | ~5                | Não             |
| coupon_usage          | Variável          | Não             |
| product_promotions    | Variável          | Não             |
| product_bundles       | ~5                | Não             |
| product_custom_colors | ~80               | Não             |
| push_subscriptions    | Variável          | Sim             |
| store_settings        | 1                 | Não             |
| user_recommendations  | Variável          | Não             |
