# API de Sincronização de Produtos

> Documentação para integrar o sistema externo (ERP/PDV) com o catálogo de produtos do Zup Deliver.

---

## 📍 Endpoint

```
POST https://lsxukelagellagzvjyuy.supabase.co/functions/v1/product-sync
```

---

## 🔐 Autenticação

A API aceita autenticação por **qualquer um** dos métodos abaixo:

| Método | Header/Param | Valor |
|--------|-------------|-------|
| Header | `x-api-key` | Valor do secret `WEBHOOK_SECRET` ou `EXTERNAL_SYSTEM_WEBHOOK_SECRET` |
| Header | `x-webhook-secret` | Valor do secret `WEBHOOK_SECRET` ou `EXTERNAL_SYSTEM_WEBHOOK_SECRET` |
| Query param | `?key=` | Valor do secret `WEBHOOK_SECRET` ou `EXTERNAL_SYSTEM_WEBHOOK_SECRET` |
| Header | `Authorization` | `Bearer <JWT>` de um usuário com role `admin` |

### Exemplo com header:

```bash
curl -X POST \
  https://lsxukelagellagzvjyuy.supabase.co/functions/v1/product-sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: SUA_CHAVE_AQUI" \
  -d '{ ... }'
```

---

## 📦 Modos de Operação

### 1. Produto Individual (Webhook)

Envie um único produto para criar, atualizar ou deletar.

#### Formato Nested (recomendado):

```json
{
  "event": "created",
  "product": {
    "name": "Cerveja Brahma 350ml",
    "price": 4.99,
    "description": "Cerveja Pilsen lata 350ml",
    "category": "Cervejas",
    "image_url": "https://exemplo.com/brahma.jpg",
    "available": true
  }
}
```

#### Formato Flat (também aceito):

```json
{
  "event": "updated",
  "name": "Cerveja Brahma 350ml",
  "price": 5.49,
  "description": "Cerveja Pilsen lata 350ml",
  "category": "Cervejas",
  "image_url": "https://exemplo.com/brahma.jpg",
  "available": true
}
```

> Se `event` for omitido no formato flat, será tratado como `"updated"`.

#### Eventos disponíveis:

| Evento | Comportamento |
|--------|--------------|
| `created` | Insere o produto. Se já existir (mesmo `name`), atualiza. |
| `updated` | Atualiza o produto existente. Se não existir, insere. |
| `deleted` | Marca o produto como `available: false` e define `deleted_at` (soft-delete). |

#### Campos do produto:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string | ✅ Sim | Nome do produto (identificador único) |
| `price` | number | ✅ Sim (create) | Preço em R$ |
| `description` | string | Não | Descrição (máx. 500 caracteres) |
| `category` | string | Não | Categoria do produto |
| `image_url` | string | Não | URL da imagem (deve ser URL válida) |
| `available` | boolean | Não | Se o produto está disponível (default: `true`) |

#### Resposta de sucesso:

```json
{
  "success": true,
  "action": "updated",
  "product": {
    "id": "uuid-do-produto",
    "name": "Cerveja Brahma 350ml",
    "price": 5.49,
    "category": "Cervejas",
    "available": true
  }
}
```

---

### 2. Batch (Array de Produtos)

Envie múltiplos produtos de uma vez no body como array:

```json
[
  {
    "event": "updated",
    "product": {
      "name": "Cerveja Brahma 350ml",
      "price": 5.49,
      "category": "Cervejas"
    }
  },
  {
    "event": "created",
    "product": {
      "name": "Refrigerante Coca-Cola 2L",
      "price": 9.99,
      "category": "Refrigerantes"
    }
  },
  {
    "event": "deleted",
    "product": {
      "name": "Produto Descontinuado"
    }
  }
]
```

#### Resposta:

```json
{
  "success": true,
  "results": [
    { "success": true, "action": "updated", "product": { ... } },
    { "success": true, "action": "created", "product": { ... } },
    { "success": true, "action": "deleted", "product": { ... } }
  ]
}
```

---

### 3. Sincronização em Massa (Bulk Sync)

Puxa **todos** os produtos da API externa e sincroniza automaticamente. Produtos que existem na base local mas **não** estão na API externa são marcados como indisponíveis (soft-delete).

```bash
curl -X POST \
  "https://lsxukelagellagzvjyuy.supabase.co/functions/v1/product-sync?mode=bulk" \
  -H "x-api-key: SUA_CHAVE_AQUI"
```

> ⚠️ Este modo requer que o secret `PRODUCTS_API_KEY` esteja configurado para acessar a API de origem dos produtos.

#### Resposta:

```json
{
  "success": true,
  "stats": {
    "total_external": 250,
    "inserted": 5,
    "updated": 240,
    "deleted": 3,
    "images_added": 12,
    "errors": 2,
    "current_with_images": 220,
    "current_without_images": 30
  },
  "timestamp": "2026-02-28T12:00:00.000Z"
}
```

---

## ⚠️ Regras Importantes

1. **Identificação por nome**: O produto é identificado pelo campo `name`. Se dois produtos tiverem o mesmo nome, serão tratados como o mesmo produto.

2. **Soft-delete**: Produtos nunca são removidos fisicamente. O evento `deleted` marca `available: false` e registra `deleted_at`.

3. **Limpeza de dados**:
   - URLs de imagem inválidas (base64, menos de 10 caracteres, valor "SIM") são ignoradas.
   - Descrições com encoding inválido (base64) são descartadas.
   - Descrições com mais de 500 caracteres são truncadas.

4. **Imagens**: Uma imagem existente **nunca** é sobrescrita por `null`. Só é atualizada se uma nova URL válida for fornecida.

---

## 🧪 Exemplos com cURL

### Criar um produto:

```bash
curl -X POST \
  https://lsxukelagellagzvjyuy.supabase.co/functions/v1/product-sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: SUA_CHAVE" \
  -d '{
    "event": "created",
    "product": {
      "name": "Água Mineral 500ml",
      "price": 2.50,
      "category": "Águas e Sucos",
      "available": true
    }
  }'
```

### Atualizar preço:

```bash
curl -X POST \
  https://lsxukelagellagzvjyuy.supabase.co/functions/v1/product-sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: SUA_CHAVE" \
  -d '{
    "event": "updated",
    "name": "Água Mineral 500ml",
    "price": 3.00
  }'
```

### Desativar produto:

```bash
curl -X POST \
  https://lsxukelagellagzvjyuy.supabase.co/functions/v1/product-sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: SUA_CHAVE" \
  -d '{
    "event": "deleted",
    "product": { "name": "Produto Descontinuado" }
  }'
```

### Batch de produtos:

```bash
curl -X POST \
  https://lsxukelagellagzvjyuy.supabase.co/functions/v1/product-sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: SUA_CHAVE" \
  -d '[
    { "name": "Cerveja Skol 350ml", "price": 3.99, "category": "Cervejas" },
    { "name": "Cerveja Heineken 350ml", "price": 6.99, "category": "Cervejas" }
  ]'
```

---

## 📊 Códigos de Resposta

| Código | Significado |
|--------|-----------|
| 200 | Operação realizada com sucesso |
| 400 | Payload inválido (campos obrigatórios ausentes) |
| 401 | Não autorizado (chave inválida ou ausente) |
| 500 | Erro interno do servidor |

---

## 🔄 Fluxo Recomendado de Integração

1. **Setup inicial**: Execute um bulk sync (`?mode=bulk`) para sincronizar todo o catálogo.
2. **Operação contínua**: Configure webhooks no ERP/PDV para enviar eventos individuais (`created`, `updated`, `deleted`) a cada alteração.
3. **Reconciliação periódica**: Agende um bulk sync diário/semanal como segurança para garantir consistência.
