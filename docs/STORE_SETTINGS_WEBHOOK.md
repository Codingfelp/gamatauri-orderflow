# Webhook de Configurações da Loja

## Endpoint

```
POST https://lsxukelagellagzvjyuy.supabase.co/functions/v1/update-store-settings
```

## Autenticação

Inclua o header `x-api-key` com o valor do secret `WEBHOOK_SECRET`:

```
x-api-key: YOUR_WEBHOOK_SECRET
Content-Type: application/json
```

## Campos Aceitos

O body deve conter um ou mais dos seguintes campos:

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `is_open` | boolean | Se a loja está aberta | `true` |
| `is_raining` | boolean | Se o modo chuva está ativo | `false` |
| `opening_time` | string | Horário de abertura (HH:MM:SS) | `"10:00:00"` |
| `closing_time` | string | Horário de fechamento (HH:MM:SS) | `"23:00:00"` |
| `max_delivery_radius_km` | number | Raio máximo de entrega em km | `5` |
| `min_delivery_fee` | number | Taxa mínima de entrega (R$) | `3` |
| `fee_per_km` | number | Valor por km (condições normais) | `3` |
| `rain_fee_per_km` | number | Valor por km (dias de chuva) | `5` |
| `closed_message` | string | Mensagem quando loja fechada | `"Voltamos às 10h!"` |
| `closed_reason` | string | Motivo do fechamento | `"Fora do horário"` |

## Exemplos de Uso

### Atualizar raio de entrega e taxas

```bash
curl -X POST \
  'https://lsxukelagellagzvjyuy.supabase.co/functions/v1/update-store-settings' \
  -H 'x-api-key: YOUR_WEBHOOK_SECRET' \
  -H 'Content-Type: application/json' \
  -d '{
    "max_delivery_radius_km": 7,
    "fee_per_km": 4,
    "rain_fee_per_km": 6,
    "min_delivery_fee": 5
  }'
```

### Ativar modo chuva

```bash
curl -X POST \
  'https://lsxukelagellagzvjyuy.supabase.co/functions/v1/update-store-settings' \
  -H 'x-api-key: YOUR_WEBHOOK_SECRET' \
  -H 'Content-Type: application/json' \
  -d '{
    "is_raining": true
  }'
```

### Fechar a loja

```bash
curl -X POST \
  'https://lsxukelagellagzvjyuy.supabase.co/functions/v1/update-store-settings' \
  -H 'x-api-key: YOUR_WEBHOOK_SECRET' \
  -H 'Content-Type: application/json' \
  -d '{
    "is_open": false,
    "closed_message": "Fechamos para manutenção",
    "closed_reason": "maintenance"
  }'
```

### Alterar horários de funcionamento

```bash
curl -X POST \
  'https://lsxukelagellagzvjyuy.supabase.co/functions/v1/update-store-settings' \
  -H 'x-api-key: YOUR_WEBHOOK_SECRET' \
  -H 'Content-Type: application/json' \
  -d '{
    "opening_time": "09:00:00",
    "closing_time": "22:00:00"
  }'
```

## Resposta de Sucesso (200)

```json
{
  "success": true,
  "message": "Configurações atualizadas com sucesso",
  "updated_fields": ["max_delivery_radius_km", "fee_per_km"],
  "data": {
    "id": "...",
    "is_open": true,
    "is_raining": false,
    "opening_time": "10:00:00",
    "closing_time": "23:00:00",
    "max_delivery_radius_km": 7,
    "min_delivery_fee": 3,
    "fee_per_km": 4,
    "rain_fee_per_km": 5,
    "updated_at": "2026-01-24T01:00:00.000Z"
  }
}
```

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 401 | API key inválida ou ausente |
| 400 | Nenhum campo válido para atualizar |
| 405 | Método HTTP não permitido (use POST) |
| 500 | Erro interno do servidor |

## Notas Importantes

1. **Atualização em tempo real**: As alterações são refletidas imediatamente no app via Supabase Realtime.

2. **Cálculo de frete**: O frete é calculado usando `fee_per_km` (ou `rain_fee_per_km` se `is_raining=true`) e sempre arredondado para cima.

3. **Fórmula do frete**: `frete = MAX(min_delivery_fee, distância_km × valor_por_km)` (arredondado para cima)

4. **Validação de raio**: Pedidos fora do `max_delivery_radius_km` mostram opção de retirada na loja.
