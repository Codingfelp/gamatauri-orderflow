# REGISTRO DE PROGRAMA DE COMPUTADOR — INPI

## DOCUMENTO DE CÓDIGO-FONTE PARA DEPÓSITO

---

### IDENTIFICAÇÃO DO SISTEMA

**Título do Programa:** Zup Deliver — Sistema de Gestão e Aplicativo de Delivery  
**Data de Consolidação:** Fevereiro de 2026  
**Copyright © 2026 — Todos os direitos reservados**

---

### INFORMAÇÕES PARA PREENCHIMENTO NO SISTEMA e-Software (INPI)

| Campo | Valor |
|-------|-------|
| **Título** | Zup Deliver — Sistema de Gestão e Aplicativo de Delivery |
| **Linguagens** | TypeScript, JavaScript, SQL |
| **Campo de Aplicação** | Sistema de comércio eletrônico e intermediação de pedidos para delivery de alimentos e bebidas, com cálculo dinâmico de frete, gerenciamento de status em tempo real, sistema de recomendações inteligentes e controle de estoque |
| **Tipo de Programa** | Aplicativo / Sistema de Gestão |

---

### SUMÁRIO DE ARQUIVOS INCLUÍDOS

O presente documento contém os trechos autorais do código-fonte do sistema, organizados em módulos:

| # | Arquivo | Descrição |
|---|---------|-----------|
| 1 | `supabase/functions/submit-order/index.ts` | API de submissão de pedidos com validação, idempotência e integração externa |
| 2 | `supabase/functions/calculate-shipping/index.ts` | Cálculo dinâmico de frete via Google Distance Matrix API |
| 3 | `supabase/functions/update-order-status/index.ts` | Webhook de atualização de status com mapeamento resiliente |
| 4 | `supabase/functions/calculate-recommendations/index.ts` | Motor de recomendações inteligentes com combos automáticos |
| 5 | `src/services/orderService.ts` | Serviço frontend de pedidos com idempotência client-side |
| 6 | `src/services/recommendationsService.ts` | Serviço de cache e consumo de recomendações |
| 7 | `src/contexts/ActiveOrderContext.tsx` | Contexto de pedido ativo com tracking realtime |
| 8 | `src/contexts/StoreStatusContext.tsx` | Contexto de status da loja com atualização em tempo real |
| 9 | `src/hooks/useBundles.ts` | Lógica de bundles/combos com cálculo de desconto |
| 10 | `src/hooks/useCartAbandonment.ts` | Sistema de recuperação de carrinho abandonado |
| 11 | `src/utils/addressValidator.ts` | Validação e parsing de endereços brasileiros |
| 12 | `src/utils/productVariants.ts` | Agrupamento inteligente de variantes de produto |
| 13 | `src/pages/Checkout.tsx` | Tela de finalização com lock anti-duplicação |

---

### ESTRUTURA ARQUITETURAL

```
┌─────────────────────────────────────────────────┐
│                 FRONTEND (React/TypeScript)       │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Contexts  │  │ Hooks    │  │ Services     │  │
│  │ (Realtime)│  │ (Lógica) │  │ (API Client) │  │
│  └─────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│        │              │               │          │
│        └──────────────┼───────────────┘          │
│                       │                          │
└───────────────────────┼──────────────────────────┘
                        │ HTTPS
┌───────────────────────┼──────────────────────────┐
│              BACKEND (Edge Functions)             │
│  ┌────────────┐  ┌───────────┐  ┌─────────────┐ │
│  │submit-order│  │calc-ship  │  │update-status│ │
│  │(Pedidos)   │  │(Frete)    │  │(Webhook)    │ │
│  └─────┬──────┘  └─────┬─────┘  └──────┬──────┘ │
│        │               │               │        │
│  ┌─────┴───────────────┴───────────────┴──────┐ │
│  │          BANCO DE DADOS (PostgreSQL)        │ │
│  │  orders │ order_items │ products │ profiles │ │
│  └─────────────────────────────────────────────┘ │
│                       │                          │
│              ┌────────┴────────┐                 │
│              │ API EXTERNA     │                 │
│              │ (Sistema Gestor)│                 │
│              └─────────────────┘                 │
└──────────────────────────────────────────────────┘
```

---

## ARQUIVO 1 — API de Submissão de Pedidos

**Caminho:** `supabase/functions/submit-order/index.ts`  
**Descrição:** Backend principal de processamento de pedidos. Implementa validação com Zod, idempotência por chave composta (telefone + hash de itens + janela temporal), proteção contra duplicatas via race condition, e integração com sistema externo via webhook autenticado.

```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas with Zod
const OrderItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  price: z.number().positive().max(99999),
  quantity: z.number().int().min(1, 'Quantidade mínima é 1').max(999),
});

const OrderSchema = z.object({
  customer_name: z.string().min(2).max(100).trim(),
  customer_phone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido'),
  customer_email: z.string().email().max(255).optional().nullable(),
  customer_address: z.string()
    .min(10, 'Endereço muito curto')
    .max(500, 'Endereço muito longo')
    .trim()
    .refine(addr => /\d+/.test(addr || ''), {
      message: 'Endereço deve conter o número da casa/prédio',
    })
    .refine(addr => (addr?.split(',').length || 0) >= 2, {
      message: 'Endereço deve conter rua, número e bairro separados por vírgula',
    })
    .optional()
    .nullable(),
  address_complement: z.string().max(200).trim().optional().nullable(),
  payment_method: z.enum(['pix', 'cartao', 'dinheiro', 'credito', 'debito']),
  payment_timing: z.string().optional(),
  items: z.array(OrderItemSchema).min(1).max(50),
  notes: z.string().max(1000).trim().optional().nullable(),
  delivery_fee: z.number().nonnegative().max(1000),
  bundle_discount: z.number().nonnegative().max(9999).default(0),
  change_for: z.string().max(50).optional().nullable(),
  idempotency_key: z.string().max(200).optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
  delivery_type: z.enum(['delivery', 'pickup']).default('delivery'),
  card_info: z.object({
    holder: z.string().max(100),
    number: z.string().max(19),
    expiry: z.string().max(7),
    cvv: z.string().max(4),
  }).optional().nullable(),
});

/**
 * Gera uma chave de idempotência baseada em:
 * - Telefone do cliente (normalizado)
 * - Hash dos itens do carrinho (IDs + quantidades ordenados)
 * - Janela de tempo de 5 minutos
 */
function generateIdempotencyKey(phone: string, items: any[]): string {
  const normalizedPhone = phone.replace(/\D/g, '');
  const sortedItems = [...items]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(item => `${item.id}:${item.quantity}`)
    .join('|');
  const timeWindow = Math.floor(Date.now() / 300000);
  return `${normalizedPhone}_${simpleHash(sortedItems)}_${timeWindow}`;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();
    const orderData = OrderSchema.parse(rawData);

    // VALIDAÇÃO CRÍTICA: Verificar frete para entregas
    if (orderData.delivery_type === 'delivery' && 
        (orderData.delivery_fee === 0 || orderData.delivery_fee === null)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'O valor do frete não foi calculado.',
          code: 'MISSING_SHIPPING_FEE'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // VALIDAÇÃO: Itens com quantidade ou preço inválido
    const invalidItems = orderData.items.filter(item => item.quantity < 1 || item.price <= 0);
    if (invalidItems.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Pedido com valor incorreto.',
          code: 'INVALID_ITEMS'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const normalizedPhone = orderData.customer_phone.replace(/\D/g, '');
    const idempotencyKey = orderData.idempotency_key || 
      generateIdempotencyKey(normalizedPhone, orderData.items);

    // Verificar pedido duplicado
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id, external_order_number, order_status, created_at')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingOrder && existingOrder.order_status !== 'cancelled') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Pedido já processado',
          already_processed: true,
          data: {
            order_id: existingOrder.id,
            order_number: existingOrder.external_order_number,
            status: existingOrder.order_status,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular totais
    const itemsTotal = orderData.items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0);
    const deliveryFee = orderData.delivery_fee || 0;
    const bundleDiscount = orderData.bundle_discount || 0;
    const totalPrice = itemsTotal - bundleDiscount + deliveryFee;

    // Inserir pedido no banco
    const { data: localOrder, error: localOrderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name: orderData.customer_name,
        customer_phone: normalizedPhone,
        customer_email: orderData.customer_email || null,
        customer_address: orderData.customer_address || null,
        payment_method: normalizePaymentMethod(orderData.payment_method),
        payment_timing: orderData.payment_timing || 'entrega',
        payment_status: 'pendente',
        order_status: 'preparing',
        total_amount: totalPrice,
        notes: orderData.notes || null,
        change_for: orderData.change_for || null,
        idempotency_key: idempotencyKey,
        user_id: orderData.user_id || null,
      })
      .select()
      .single();

    if (localOrderError || !localOrder) {
      // Race condition: verificar se foi duplicata
      if (localOrderError?.code === '23505' && 
          localOrderError?.message?.includes('idempotency_key')) {
        const { data: raceOrder } = await supabaseAdmin
          .from('orders')
          .select('id, external_order_number, order_status')
          .eq('idempotency_key', idempotencyKey)
          .single();

        if (raceOrder) {
          return new Response(
            JSON.stringify({
              success: true,
              already_processed: true,
              data: { order_id: raceOrder.id, order_number: raceOrder.external_order_number },
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      throw new Error('Falha ao salvar pedido no banco de dados');
    }

    // Salvar itens do pedido
    const orderItemsData = orderData.items.map((item) => ({
      order_id: localOrder.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      product_price: item.price,
      subtotal: item.price * item.quantity,
    }));

    await supabaseAdmin.from('order_items').insert(orderItemsData);

    // Enviar para sistema externo com retry (3 tentativas)
    // ... integração com API externa ...

    return new Response(
      JSON.stringify({ success: true, data: { order_id: localOrder.id } }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Dados inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          })),
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // ... tratamento de erros genéricos ...
  }
});

function normalizePaymentMethod(method: string): string {
  const normalized = method.toLowerCase();
  if (normalized === 'credito' || normalized === 'debito' || normalized === 'cartão') {
    return 'cartao';
  }
  const allowedMethods = ['pix', 'cartao', 'dinheiro'];
  return allowedMethods.includes(normalized) ? normalized : 'dinheiro';
}

function mapPaymentMethod(method: string): string {
  const mapping: Record<string, string> = {
    'pix': 'Pix', 'cartao': 'Cartão', 'dinheiro': 'Dinheiro',
  };
  return mapping[method.toLowerCase()] || 'Dinheiro';
}
```

---

## ARQUIVO 2 — Cálculo Dinâmico de Frete

**Caminho:** `supabase/functions/calculate-shipping/index.ts`  
**Descrição:** Calcula frete dinamicamente com base na distância real (Google Distance Matrix API), com configurações dinâmicas do banco de dados (taxa por km, taxa de chuva, raio máximo). Arredonda frete para cima e sinaliza endereços fora do raio sem abortar.

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface StoreSettings {
  max_delivery_radius_km: number;
  min_delivery_fee: number;
  fee_per_km: number;
  rain_fee_per_km: number;
  is_raining: boolean;
}

const DEFAULT_SETTINGS: StoreSettings = {
  max_delivery_radius_km: 5,
  min_delivery_fee: 3,
  fee_per_km: 3,
  rain_fee_per_km: 5,
  is_raining: false,
};

async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data, error } = await supabase
      .from("store_settings")
      .select("max_delivery_radius_km, min_delivery_fee, fee_per_km, rain_fee_per_km, is_raining")
      .limit(1).single();

    if (error) return DEFAULT_SETTINGS;
    return {
      max_delivery_radius_km: data.max_delivery_radius_km ?? DEFAULT_SETTINGS.max_delivery_radius_km,
      min_delivery_fee: data.min_delivery_fee ?? DEFAULT_SETTINGS.min_delivery_fee,
      fee_per_km: data.fee_per_km ?? DEFAULT_SETTINGS.fee_per_km,
      rain_fee_per_km: data.rain_fee_per_km ?? DEFAULT_SETTINGS.rain_fee_per_km,
      is_raining: data.is_raining ?? DEFAULT_SETTINGS.is_raining,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

serve(async (req) => {
  // ... CORS handling ...

  const { destination } = await req.json();
  const settings = await getStoreSettings();

  const STORE_ADDRESS = 'R. Aiuruoca, 192, Fernão Dias, Belo Horizonte - MG, 31910-444';
  
  // Normalizar endereço
  let normalizedDestination = destination.trim();
  if (!/Belo Horizonte|BH|Contagem|Betim/i.test(normalizedDestination)) {
    normalizedDestination += ', Belo Horizonte - MG';
  }

  // Google Distance Matrix API
  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
  url.searchParams.append('units', 'metric');
  url.searchParams.append('origins', STORE_ADDRESS);
  url.searchParams.append('destinations', normalizedDestination);
  url.searchParams.append('key', Deno.env.get('GOOGLE_DISTANCE_MATRIX_API_KEY')!);

  const response = await fetch(url.toString());
  const data = await response.json();

  const element = data.rows[0]?.elements[0];
  const distanceInKm = element.distance.value / 1000;

  // Regra de negócio: fora do raio sinaliza mas NÃO aborta
  const isOutOfRange = distanceInKm > settings.max_delivery_radius_km;

  // Cálculo com taxa dinâmica (chuva ou normal)
  const pricePerKm = settings.is_raining ? settings.rain_fee_per_km : settings.fee_per_km;
  const rawShippingFee = Math.max(settings.min_delivery_fee, distanceInKm * pricePerKm);
  const shippingFee = Math.ceil(rawShippingFee); // Sempre arredonda para cima

  return new Response(JSON.stringify({
    distance_km: Math.round(distanceInKm * 100) / 100,
    shipping_fee: shippingFee,
    duration_text: element.duration.text,
    is_raining: settings.is_raining,
    ...(isOutOfRange ? { out_of_range: true, message: `Fora do raio de ${settings.max_delivery_radius_km}km` } : {}),
  }));
});
```

---

## ARQUIVO 3 — Webhook de Atualização de Status

**Caminho:** `supabase/functions/update-order-status/index.ts`  
**Descrição:** Recebe webhooks de sistemas externos com mapeamento resiliente de status. Suporta autenticação via header ou query param, aceita múltiplos formatos de status (português/inglês) com fallback por regex.

```typescript
// Map external API statuses to internal database statuses
function mapExternalStatusToInternal(externalStatus: string): string {
  const statusLower = externalStatus.toLowerCase().trim();
  
  const statusMap: Record<string, string> = {
    'received': 'received', 'recebido': 'received', 'pending': 'received',
    'preparing': 'preparing', 'preparando': 'preparing', 'accepted': 'preparing',
    'in_route': 'in_route', 'delivering': 'in_route', 'shipped': 'in_route',
    'saiu_para_entrega': 'in_route', 'em_rota_entrega': 'in_route',
    'delivered': 'delivered', 'entregue': 'delivered', 'completed': 'delivered',
    'cancelled': 'cancelled', 'cancelado': 'cancelled',
  };

  if (statusMap[statusLower]) return statusMap[statusLower];

  // Fallback resiliente por regex (novos status não quebram o sistema)
  if (/(cancel|cancelad)/.test(statusLower)) return 'cancelled';
  if (/(entreg|deliver|completed|finaliz)/.test(statusLower)) return 'delivered';
  if (/(rota|route|saiu|dispatch|shipp|entregand)/.test(statusLower)) return 'in_route';
  if (/(prepar|process|accept|aceit)/.test(statusLower)) return 'preparing';
  if (/(receb|confirm|pending)/.test(statusLower)) return 'received';

  return 'preparing'; // Default seguro
}
```

---

## ARQUIVO 4 — Motor de Recomendações Inteligentes

**Caminho:** `supabase/functions/calculate-recommendations/index.ts`  
**Descrição:** Calcula recomendações personalizadas baseadas no histórico do cliente: top 5 recorrentes, produtos similares por categoria, e combos inteligentes por regras de associação (ex: whisky → energético + gelo).

```typescript
// 3️⃣ CALCULAR TOP 5 PRODUTOS RECORRENTES
const productFrequency = new Map<string, ProductFrequency>();

orderItems?.forEach((item) => {
  const existing = productFrequency.get(item.product_id) || {
    product_id: item.product_id, product_name: item.product_name,
    frequency: 0, total_bought: 0, last_purchase: '', avg_price: 0,
  };
  existing.frequency += 1;
  existing.total_bought += item.quantity;
  productFrequency.set(item.product_id, existing);
});

const topRecurrent = Array.from(productFrequency.values())
  .sort((a, b) => b.frequency - a.frequency || b.total_bought - a.total_bought)
  .slice(0, 5)
  .map((p) => ({
    product_id: p.product_id, product_name: p.product_name,
    reason: 'recurrent',
    score: p.frequency * 10 + p.total_bought,
  }));

// 5️⃣ COMBOS INTELIGENTES (Regras de associação)
// Whisky/Vodka → Energético + Gelo
const hasSpirit = productNames.some(
  (name) => name.includes('whisky') || name.includes('vodka')
);
if (hasSpirit && allProducts) {
  const energetico = allProducts.find((p) => p.name.toLowerCase().includes('red bull'));
  const gelo = allProducts.find((p) => p.name.toLowerCase().includes('gelo'));
  if (energetico && gelo) {
    combos.push({
      combo_name: 'Combo Festa',
      products: [energetico.id, gelo.id],
      reason: 'combo', score: 8,
    });
  }
}
```

---

## ARQUIVO 5 — Serviço Frontend de Pedidos

**Caminho:** `src/services/orderService.ts`  
**Descrição:** Camada de serviço que valida dados no frontend, gera chave de idempotência client-side, sanitiza telefone e comunica com o backend.

```typescript
function generateIdempotencyKey(phone: string, items: OrderItem[]): string {
  const normalizedPhone = phone.replace(/\D/g, '');
  const sortedItems = [...items]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(item => `${item.id}:${item.quantity}`)
    .join('|');
  
  let hash = 0;
  for (let i = 0; i < sortedItems.length; i++) {
    const char = sortedItems.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hashStr = Math.abs(hash).toString(36);
  const timeWindow = Math.floor(Date.now() / 300000);
  
  return `${normalizedPhone}_${hashStr}_${timeWindow}`;
}

export async function submitOrder(orderData: OrderPayload): Promise<OrderResponse['data']> {
  // Validações frontend
  if (!orderData.customer_name?.trim()) throw new Error('Nome do cliente é obrigatório');
  if (!orderData.items || orderData.items.length === 0) throw new Error('Carrinho está vazio');
  
  const sanitizedPhone = orderData.customer_phone.replace(/[^\d]/g, '');
  if (sanitizedPhone.length < 10) throw new Error('Telefone inválido');

  const idempotencyKey = generateIdempotencyKey(sanitizedPhone, orderData.items);

  const { data, error } = await supabase.functions.invoke('submit-order', {
    body: { ...payload, idempotency_key: idempotencyKey },
  });

  if (data.already_processed) {
    console.log('⚠️ Pedido já havia sido processado anteriormente');
  }

  return data.data;
}
```

---

## ARQUIVO 6 — Contexto de Pedido Ativo com Tracking Realtime

**Caminho:** `src/contexts/ActiveOrderContext.tsx`  
**Descrição:** Gerencia o estado do pedido ativo com subscription Realtime (PostgreSQL Changes), mapeamento de status com regex resiliente, detecção de cancelamento e auto-clear após entrega.

```typescript
// Map database status to canonical status
const mapDbStatusToCanonical = (dbStatus: string): OrderStatus => {
  const normalized = dbStatus?.toLowerCase()?.trim() || 'received';
  
  if (/(cancel|cancelad)/.test(normalized)) return 'cancelled';
  if (/(deliver|entreg|conclu|finaliz|closed)/.test(normalized)) return 'delivered';
  if (/(rota|route|saiu|dispatch|delivering|pronto|ready|shipp|enviad)/.test(normalized)) return 'in_route';
  if (/(prepar|aceito|accepted|separando)/.test(normalized)) return 'preparing';
  return 'received';
};

// Subscribe to realtime updates
useEffect(() => {
  if (!activeOrder?.orderId) return;
  const channel = supabase
    .channel(`order-${activeOrder.orderId}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'orders',
      filter: `id=eq.${activeOrder.orderId}`,
    }, (payload) => {
      const newStatus = mapDbStatusToCanonical(payload.new.order_status);
      
      if (newStatus === 'cancelled') {
        fetchCancelledOrderDetails(activeOrder.orderId);
        clearActiveOrder();
        return;
      }
      setActiveOrder({ ...activeOrder, status: newStatus });
      if (newStatus === 'delivered') {
        setTimeout(() => clearActiveOrder(), 5000);
      }
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [activeOrder?.orderId]);
```

---

## ARQUIVO 7 — Lógica de Bundles/Combos Promocionais

**Caminho:** `src/hooks/useBundles.ts`  
**Descrição:** Calcula descontos de bundles promocionais em tempo real. Busca bundles ativos do banco, filtra por data no client, e aplica desconto maximizado (ordenando itens por preço decrescente).

```typescript
const calculateBundleDiscounts = useCallback((cartItems: CartItem[]): BundleDiscount[] => {
  const discounts: BundleDiscount[] = [];

  for (const bundle of bundles) {
    const eligibleItems = cartItems.filter(item => bundle.product_ids.includes(item.id));
    if (eligibleItems.length === 0) continue;

    const totalEligibleQuantity = eligibleItems.reduce((sum, item) => sum + item.quantity, 0);
    const bundleApplications = Math.floor(totalEligibleQuantity / bundle.quantity_required);

    if (bundleApplications > 0) {
      // Ordenar por preço (mais caros primeiro para maximizar desconto)
      const sortedItems = [...eligibleItems].sort((a, b) => b.price - a.price);
      
      let remainingQuantity = bundleApplications * bundle.quantity_required;
      let originalTotal = 0;

      for (const item of sortedItems) {
        const quantityToUse = Math.min(item.quantity, remainingQuantity);
        if (quantityToUse > 0) {
          originalTotal += item.price * quantityToUse;
          remainingQuantity -= quantityToUse;
        }
        if (remainingQuantity <= 0) break;
      }

      const bundleTotal = bundleApplications * bundle.bundle_price;
      const discount = originalTotal - bundleTotal;
      if (discount > 0) {
        discounts.push({ bundleId: bundle.id, bundleName: bundle.name, discount, appliedCount: bundleApplications });
      }
    }
  }
  return discounts;
}, [bundles]);
```

---

## ARQUIVO 8 — Validação de Endereços Brasileiros

**Caminho:** `src/utils/addressValidator.ts`  
**Descrição:** Parser e validador de endereços no formato brasileiro. Implementa validação estrutural (rua, número, bairro, cidade) e validação flexível para checkout que confia no cálculo de frete.

```typescript
export function parseAddress(address: string): ParsedAddress | null {
  if (!address || address.trim().length < 10) return null;
  const parts = address.split(',').map(p => p.trim());
  if (parts.length < 2) return null;

  const streetPart = parts[0] || '';
  const numberMatch = streetPart.match(/\d+[A-Za-z]?$/);
  
  return {
    street: numberMatch ? streetPart.replace(/\d+[A-Za-z]?$/, '').trim() : streetPart,
    number: numberMatch ? numberMatch[0] : '',
    neighborhood: parts[1] || '',
    city: parts[2]?.split('-')[0]?.trim() || '',
    state: parts[2]?.split('-')[1]?.trim() || '',
  };
}

export function isAddressValidForCheckout(
  address: string | null, shippingFee: number
): { valid: boolean; reason: string | null } {
  // Se o frete foi calculado com sucesso, endereço é válido
  if (shippingFee > 0) return { valid: true, reason: null };
  if (!address || address.trim().length < 10) return { valid: false, reason: 'Endereço muito curto' };
  if (!/\d+/.test(address)) return { valid: false, reason: 'Endereço sem número' };
  return { valid: true, reason: null };
}
```

---

## ARQUIVO 9 — Agrupamento Inteligente de Variantes

**Caminho:** `src/utils/productVariants.ts`  
**Descrição:** Sistema de agrupamento de produtos por marca/sabor/tamanho com regras por categoria. Extrai variantes (350ml, Lata, Long Neck), detecta marcas via regex, e atribui cores temáticas por marca (~200 mapeamentos).

```typescript
const GROUPING_RULES: Record<string, { groupBy: string[]; extractSize: boolean; extractFlavor: boolean }> = {
  'Cervejas': { groupBy: ['brand'], extractSize: true, extractFlavor: false },
  'Refrigerantes': { groupBy: ['size'], extractSize: true, extractFlavor: true },
  'Energéticos': { groupBy: ['brand', 'size'], extractSize: true, extractFlavor: true },
  'Vinhos': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  'Destilados': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  'Chocolates': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  'Snacks': { groupBy: ['brand'], extractSize: false, extractFlavor: true },
  // ... mais categorias
};

const BRAND_PATTERNS: Record<string, RegExp> = {
  energeticos: /^(Baly|Red Bull|Monster|Fusion)\s*/i,
  cervejas: /^(Heineken|Brahma|Skol|Antarctica|Budweiser|Stella|Corona|...)\s*/i,
  drinks: /^(Beats|Smirnoff|Xeque Mate|...)\s*/i,
  // ... mais padrões
};

// ~200 mapeamentos de cores por marca
const BRAND_COLORS: Record<string, string> = {
  'heineken': '#90EE90', 'brahma': '#C41E3A', 'skol': '#FFD700',
  'coca-cola': '#DC143C', 'pepsi': '#0066CC', 'sprite': '#90EE90',
  'red bull': '#0047AB', 'monster': '#32CD32',
  'absolut': '#B8C6D6', 'jack daniels': '#1C1C1C',
  'tanqueray': '#006B54', 'bombay sapphire': '#4FC3F7',
  // ... extenso mapeamento autoral
};
```

---

## ARQUIVO 10 — Recuperação de Carrinho Abandonado

**Caminho:** `src/hooks/useCartAbandonment.ts`  
**Descrição:** Detecta abandono de carrinho via Visibility API, persiste carrinho no localStorage e agenda notificação push após 30 minutos de inatividade.

```typescript
export const useCartAbandonment = (cart: CartItem[], userId?: string) => {
  useEffect(() => {
    let abandonmentTimer: NodeJS.Timeout;

    const handleVisibilityChange = async () => {
      if (document.hidden && cart.length > 0 && userId) {
        localStorage.setItem('gamatauri-abandoned-cart', JSON.stringify({
          items: cart, abandonedAt: new Date().toISOString()
        }));
        abandonmentTimer = setTimeout(async () => {
          await scheduleCartAbandonmentNotification(cart);
        }, 30 * 60 * 1000); // 30 minutos
      } else if (!document.hidden && abandonmentTimer) {
        clearTimeout(abandonmentTimer);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (abandonmentTimer) clearTimeout(abandonmentTimer);
    };
  }, [cart, userId]);
};
```

---

### DECLARAÇÃO DE AUTORIA

Declaro, sob as penas da lei, que o código-fonte apresentado neste documento é de minha autoria exclusiva, desenvolvido por iniciativa própria como parte do sistema **Zup Deliver**. O desenvolvimento foi realizado de forma independente, sem vínculo empregatício ou contratual com qualquer empresa, e sem cessão parcial ou total de direitos patrimoniais ou morais a terceiros. Bibliotecas e frameworks de terceiros (React, Supabase, Zod, Tailwind CSS) são utilizados como ferramentas e NÃO fazem parte do código autoral registrado.

**Data:** ___/___/2026  
**Nome completo:** ___________________________  
**CPF:** ___________________________  
**Assinatura:** ___________________________

---

### HASH DE VERIFICAÇÃO

Para fins de prova de anterioridade, gere o hash SHA-256 do repositório completo:

```bash
# No diretório raiz do projeto:
find src supabase/functions -name "*.ts" -o -name "*.tsx" | sort | xargs cat | sha256sum
```

Guarde o resultado em local seguro junto com a data de geração.

---

*FIM DO DOCUMENTO — © 2026 Zup Deliver*
