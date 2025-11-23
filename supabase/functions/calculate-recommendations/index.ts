import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  product_price: number;
}

interface Order {
  id: string;
  created_at: string;
  customer_phone: string;
  total_amount: number;
}

interface ProductFrequency {
  product_id: string;
  product_name: string;
  frequency: number;
  total_bought: number;
  last_purchase: string;
  avg_price: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { customer_phone, user_id } = await req.json();

    if (!customer_phone) {
      throw new Error('customer_phone é obrigatório');
    }

    console.log(`📊 Calculando recomendações para: ${customer_phone}`);

    // 1️⃣ BUSCAR HISTÓRICO DE PEDIDOS
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, created_at, total_amount, customer_phone')
      .eq('customer_phone', customer_phone)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    if (!orders || orders.length === 0) {
      console.log('⚠️ Cliente sem histórico, retornando recomendações vazias');
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            top_recurrent: [],
            similar: [],
            behavioral: [],
            combos: [],
            is_new_customer: true,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderIds = orders.map((o) => o.id);

    // 2️⃣ BUSCAR ITENS DOS PEDIDOS
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, product_name, quantity, product_price, order_id')
      .in('order_id', orderIds);

    if (itemsError) throw itemsError;

    // 3️⃣ CALCULAR TOP 5 PRODUTOS RECORRENTES
    const productFrequency = new Map<string, ProductFrequency>();

    orderItems?.forEach((item) => {
      const existing = productFrequency.get(item.product_id) || {
        product_id: item.product_id,
        product_name: item.product_name,
        frequency: 0,
        total_bought: 0,
        last_purchase: '',
        avg_price: 0,
      };

      existing.frequency += 1;
      existing.total_bought += item.quantity;
      existing.avg_price =
        (existing.avg_price * existing.frequency + item.product_price) / (existing.frequency + 1);

      const order = orders.find((o) => o.id === item.order_id);
      if (order && (!existing.last_purchase || order.created_at > existing.last_purchase)) {
        existing.last_purchase = order.created_at;
      }

      productFrequency.set(item.product_id, existing);
    });

    const topRecurrent = Array.from(productFrequency.values())
      .sort((a, b) => b.frequency - a.frequency || b.total_bought - a.total_bought)
      .slice(0, 5)
      .map((p) => ({
        product_id: p.product_id,
        product_name: p.product_name,
        reason: 'recurrent',
        score: p.frequency * 10 + p.total_bought,
        metadata: {
          frequency: p.frequency,
          total_bought: p.total_bought,
          last_purchase: p.last_purchase,
        },
      }));

    console.log(`✅ Top 5 recorrentes: ${topRecurrent.map((p) => p.product_name).join(', ')}`);

    // 4️⃣ PRODUTOS SIMILARES (mesma categoria ou complementares)
    const { data: allProducts } = await supabase
      .from('products')
      .select('id, name, category, price')
      .eq('available', true);

    const topCategories = new Set(
      topRecurrent.map((p) => {
        const product = allProducts?.find((prod) => prod.id === p.product_id);
        return product?.category;
      }).filter(Boolean)
    );

    const similarProducts = (allProducts || [])
      .filter((p) => {
        // Não incluir produtos já nos recorrentes
        if (topRecurrent.some((rec) => rec.product_id === p.id)) return false;
        // Incluir produtos da mesma categoria
        return topCategories.has(p.category);
      })
      .slice(0, 6)
      .map((p) => ({
        product_id: p.id,
        product_name: p.name,
        reason: 'similar',
        score: 5,
      }));

    console.log(`✅ Produtos similares: ${similarProducts.length} encontrados`);

    // 5️⃣ COMBOS INTELIGENTES
    const combos: any[] = [];
    const productNames = topRecurrent.map((p) => p.product_name.toLowerCase());

    // Regra 1: Whisky/Vodka → Energético + Gelo
    const hasSpirit = productNames.some(
      (name) =>
        name.includes('whisky') ||
        name.includes('vodka') ||
        name.includes('label') ||
        name.includes('absolut')
    );

    if (hasSpirit && allProducts) {
      const energetico = allProducts.find((p) => p.name.toLowerCase().includes('red bull'));
      const gelo = allProducts.find((p) => p.name.toLowerCase().includes('gelo'));

      if (energetico && gelo) {
        combos.push({
          combo_name: 'Combo Festa',
          products: [energetico.id, gelo.id],
          reason: 'combo',
          score: 8,
          metadata: {
            combo_with: ['Destilados'],
            description: '🎉 Energético + Gelo para sua bebida',
          },
        });
      }
    }

    // Regra 2: Cerveja → Snacks + Gelo
    const hasBeer = productNames.some((name) => name.includes('cerveja') || name.includes('brahma') || name.includes('heineken'));

    if (hasBeer && allProducts) {
      const snack = allProducts.find((p) => p.name.toLowerCase().includes('doritos') || p.name.toLowerCase().includes('ruffles'));
      const gelo = allProducts.find((p) => p.name.toLowerCase().includes('gelo'));

      if (snack && gelo) {
        combos.push({
          combo_name: 'Combo Cerveja',
          products: [snack.id, gelo.id],
          reason: 'combo',
          score: 7,
          metadata: {
            combo_with: ['Cervejas'],
            description: '🍺 Snack + Gelo para suas cervejas',
          },
        });
      }
    }

    console.log(`✅ Combos inteligentes: ${combos.length} gerados`);

    // 6️⃣ CALCULAR CATEGORIAS FAVORITAS
    const categoryCount = new Map<string, number>();
    orderItems?.forEach((item) => {
      const product = allProducts?.find((p) => p.id === item.product_id);
      if (product?.category) {
        categoryCount.set(product.category, (categoryCount.get(product.category) || 0) + 1);
      }
    });

    const favoriteCategories = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((entry) => entry[0]);

    // 7️⃣ CALCULAR TICKET MÉDIO
    const avgTicket = orders.reduce((sum, o) => sum + Number(o.total_amount), 0) / orders.length;

    // 8️⃣ SALVAR NO CACHE
    const { error: upsertError } = await supabase
      .from('user_recommendations')
      .upsert(
        {
          user_id: user_id || null,
          customer_phone,
          top_recurrent_products: topRecurrent,
          similar_products: similarProducts,
          behavioral_products: [], // Pode ser expandido futuramente
          smart_combos: combos,
          last_purchase_date: orders[0].created_at,
          total_orders: orders.length,
          favorite_categories: favoriteCategories,
          avg_ticket_value: avgTicket,
          updated_at: new Date().toISOString(),
          cache_valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: 'customer_phone' }
      );

    if (upsertError) throw upsertError;

    console.log(`✅ Cache atualizado com sucesso para ${customer_phone}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          top_recurrent: topRecurrent,
          similar: similarProducts,
          behavioral: [],
          combos: combos,
          metadata: {
            total_orders: orders.length,
            favorite_categories: favoriteCategories,
            avg_ticket: avgTicket,
            cache_updated: true,
          },
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Erro ao calcular recomendações:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
