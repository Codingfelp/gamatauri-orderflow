# API de Produtos Favoritos - Documentação

## Endpoint

```
POST https://lsxukelagellagzvjyuy.supabase.co/functions/v1/customer-api
```

## Autenticação

Use **um** dos métodos abaixo:

| Método | Header/Param | Exemplo |
|--------|--------------|---------|
| Header `x-api-key` | `x-api-key: {WEBHOOK_SECRET}` | `x-api-key: minha-chave-secreta` |
| Header `x-webhook-secret` | `x-webhook-secret: {WEBHOOK_SECRET}` | `x-webhook-secret: minha-chave-secreta` |
| Query Parameter | `?key={WEBHOOK_SECRET}` | `?key=minha-chave-secreta` |

---

## Ações Disponíveis

### 1. **Adicionar produtos aos favoritos** (`add`)

Adiciona produtos à lista existente de favoritos do cliente.

```json
POST /functions/v1/customer-api
Content-Type: application/json
x-api-key: {WEBHOOK_SECRET}

{
  "email": "cliente@email.com",
  "action": "add",
  "favorite_products": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

**Resposta de sucesso:**
```json
{
  "success": true,
  "message": "Favorite products updated",
  "favorite_products": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

---

### 2. **Remover produtos dos favoritos** (`remove`)

Remove produtos específicos da lista de favoritos.

```json
POST /functions/v1/customer-api
Content-Type: application/json
x-api-key: {WEBHOOK_SECRET}

{
  "phone": "11999999999",
  "action": "remove",
  "favorite_products": [
    "550e8400-e29b-41d4-a716-446655440001"
  ]
}
```

---

### 3. **Substituir lista completa** (`set`)

Substitui toda a lista de favoritos pelos produtos informados.

```json
POST /functions/v1/customer-api
Content-Type: application/json
x-api-key: {WEBHOOK_SECRET}

{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "action": "set",
  "favorite_products": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002",
    "550e8400-e29b-41d4-a716-446655440003"
  ]
}
```

---

## Identificadores de Cliente

Você pode identificar o cliente por **qualquer um** destes campos:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `email` | Email do cliente | `"cliente@email.com"` |
| `phone` | Telefone (apenas números) | `"11999999999"` |
| `user_id` | UUID do usuário no sistema | `"123e4567-e89b-12d3-a456-426614174000"` |

---

## Onde obter UUIDs dos produtos?

Use o endpoint GET para listar produtos:

```bash
curl -X GET "https://lsxukelagellagzvjyuy.supabase.co/functions/v1/fetch-products" \
  -H "x-api-key: {WEBHOOK_SECRET}"
```

Resposta:
```json
{
  "products": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Coca-Cola 2L",
      "price": 12.99,
      "category": "Refrigerante"
    },
    ...
  ]
}
```

---

## Códigos de Resposta

| Código | Significado |
|--------|-------------|
| `200` | Sucesso |
| `400` | Requisição inválida (campo faltando, ação inválida) |
| `401` | Não autorizado (chave API inválida) |
| `404` | Cliente não encontrado |
| `500` | Erro interno do servidor |

---

## Exemplos cURL

### Adicionar favoritos por email:
```bash
curl -X POST "https://lsxukelagellagzvjyuy.supabase.co/functions/v1/customer-api" \
  -H "Content-Type: application/json" \
  -H "x-api-key: SUA_CHAVE_SECRETA" \
  -d '{
    "email": "cliente@email.com",
    "action": "add",
    "favorite_products": ["uuid-produto-1", "uuid-produto-2"]
  }'
```

### Substituir favoritos por telefone:
```bash
curl -X POST "https://lsxukelagellagzvjyuy.supabase.co/functions/v1/customer-api" \
  -H "Content-Type: application/json" \
  -H "x-api-key: SUA_CHAVE_SECRETA" \
  -d '{
    "phone": "11999999999",
    "action": "set",
    "favorite_products": ["uuid-1", "uuid-2", "uuid-3"]
  }'
```

---

## Efeito no App

Quando produtos são adicionados aos favoritos de um cliente:

1. ✅ Aparecem na seção **"Selecionados para você"** no topo da página inicial
2. ✅ Têm design premium com gradientes dourados e badge de estrela
3. ✅ São priorizados na exibição para o cliente

---

## Suporte

Em caso de dúvidas, verifique:
- A chave API está correta
- Os UUIDs dos produtos existem no banco de dados
- O email/telefone/user_id corresponde a um cliente cadastrado
