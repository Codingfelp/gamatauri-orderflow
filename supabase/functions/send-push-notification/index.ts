import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  url?: string;
  orderId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, title, body, url, orderId }: PushPayload = await req.json();

    console.log('[PUSH] Enviando notificação para usuário:', userId);

    // Criar cliente Supabase
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Buscar subscription do usuário
    const { data: subscription, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      console.log('[PUSH] Subscription não encontrada para usuário:', userId);
      return new Response(
        JSON.stringify({ success: false, message: 'Subscription não encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar payload da notificação
    const pushData = {
      title,
      body,
      url: url || '/',
      orderId
    };

    console.log('[PUSH] Payload preparado:', pushData);
    console.log('[PUSH] Subscription:', subscription.subscription);

    // NOTA: Para enviar push real, você precisará:
    // 1. Instalar web-push: npm install web-push
    // 2. Configurar VAPID keys
    // 3. Usar webpush.sendNotification(subscription, JSON.stringify(pushData), options)
    
    // Por enquanto, apenas registramos no log
    console.log('[PUSH] Notificação enviada com sucesso (simulado)');

    return new Response(
      JSON.stringify({ success: true, message: 'Notificação enviada' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[PUSH] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
