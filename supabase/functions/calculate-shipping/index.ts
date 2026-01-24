import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShippingRequest {
  destination: string;
}

interface ShippingResponse {
  distance_km: number;
  shipping_fee: number;
  duration_text: string;
  is_raining?: boolean;
}

interface StoreSettings {
  max_delivery_radius_km: number;
  min_delivery_fee: number;
  fee_per_km: number;
  rain_fee_per_km: number;
  is_raining: boolean;
}

// Valores padrão caso não consiga buscar do banco
const DEFAULT_SETTINGS: StoreSettings = {
  max_delivery_radius_km: 5,
  min_delivery_fee: 3,
  fee_per_km: 3,
  rain_fee_per_km: 5,
  is_raining: false,
};

async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("store_settings")
      .select("max_delivery_radius_km, min_delivery_fee, fee_per_km, rain_fee_per_km, is_raining")
      .limit(1)
      .single();

    if (error) {
      console.error("❌ Error fetching store settings:", error);
      return DEFAULT_SETTINGS;
    }

    return {
      max_delivery_radius_km: data.max_delivery_radius_km ?? DEFAULT_SETTINGS.max_delivery_radius_km,
      min_delivery_fee: data.min_delivery_fee ?? DEFAULT_SETTINGS.min_delivery_fee,
      fee_per_km: data.fee_per_km ?? DEFAULT_SETTINGS.fee_per_km,
      rain_fee_per_km: data.rain_fee_per_km ?? DEFAULT_SETTINGS.rain_fee_per_km,
      is_raining: data.is_raining ?? DEFAULT_SETTINGS.is_raining,
    };
  } catch (error) {
    console.error("❌ Exception fetching store settings:", error);
    return DEFAULT_SETTINGS;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination }: ShippingRequest = await req.json();

    if (!destination || destination.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Endereço de destino é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar configurações dinâmicas do banco
    const settings = await getStoreSettings();
    console.log('📊 Store settings loaded:', settings);

    // Endereço da loja (origem)
    const STORE_ADDRESS = 'R. Aiuruoca, 192, Fernão Dias, Belo Horizonte - MG, 31910-444';
    
    // API Key do Google (armazenada como secret)
    const API_KEY = Deno.env.get('GOOGLE_DISTANCE_MATRIX_API_KEY');

    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Configuração de API inválida' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalizar endereço de destino (fallback de segurança)
    let normalizedDestination = destination.trim();
    const hasCityMention = /Belo Horizonte|BH|Contagem|Betim/i.test(normalizedDestination);
    
    if (!hasCityMention) {
      normalizedDestination += ', Belo Horizonte - MG';
      console.log('🔧 Endereço normalizado no backend:', normalizedDestination);
    }

    // Montar URL da API
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.append('units', 'metric');
    url.searchParams.append('origins', STORE_ADDRESS);
    url.searchParams.append('destinations', normalizedDestination);
    url.searchParams.append('key', API_KEY);

    console.log('📍 Calculando distância de:', STORE_ADDRESS);
    console.log('📍 Para:', normalizedDestination);

    // Chamar Google Distance Matrix API
    const response = await fetch(url.toString());
    const data = await response.json();

    console.log('📊 Resposta da API:', JSON.stringify(data, null, 2));

    // Validar resposta
    if (data.status !== 'OK') {
      console.error('❌ Erro na API do Google:', {
        status: data.status,
        error_message: data.error_message,
        raw_response: JSON.stringify(data)
      });
      
      // Mensagens de erro mais específicas
      let userMessage = 'Não foi possível calcular a distância';
      
      if (data.status === 'REQUEST_DENIED') {
        userMessage = 'Erro de configuração da API do Google Maps';
        console.error('🚨 REQUEST_DENIED - Possíveis causas:');
        console.error('   1. Billing não habilitado no projeto Google Cloud');
        console.error('   2. Distance Matrix API não habilitada');
        console.error('   3. API Key com restrições incorretas');
        console.error('   4. API Key expirada ou inválida');
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        userMessage = 'Limite de requisições da API excedido';
      }
      
      return new Response(
        JSON.stringify({ 
          error: userMessage, 
          details: data.error_message,
          status: data.status
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const element = data.rows[0]?.elements[0];
    
    if (!element || element.status !== 'OK') {
      console.error('❌ Endereço não encontrado:', element?.status);
      return new Response(
        JSON.stringify({ error: 'Endereço não encontrado ou inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair dados
    const distanceInMeters = element.distance.value; // em metros
    const distanceInKm = distanceInMeters / 1000; // converter para KM
    const durationText = element.duration.text;

    console.log('📏 Distância calculada:', distanceInKm.toFixed(2), 'km');
    console.log('📏 Raio máximo configurado:', settings.max_delivery_radius_km, 'km');

    // Verificar se está dentro do raio de entrega (usando valor dinâmico)
    if (distanceInKm > settings.max_delivery_radius_km) {
      console.log('❌ Fora do raio de entrega:', distanceInKm, 'km (máximo:', settings.max_delivery_radius_km, 'km)');
      return new Response(
        JSON.stringify({ 
          error: 'Fora da área de atendimento',
          message: `Infelizmente não entregamos além de ${settings.max_delivery_radius_km}km. Sua localização está a ${distanceInKm.toFixed(1)}km da nossa loja.`,
          out_of_range: true,
          distance_km: Math.round(distanceInKm * 100) / 100,
          max_radius_km: settings.max_delivery_radius_km
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular frete usando valores dinâmicos
    const pricePerKm = settings.is_raining ? settings.rain_fee_per_km : settings.fee_per_km;
    const rawShippingFee = Math.max(settings.min_delivery_fee, distanceInKm * pricePerKm);
    // Arredondar frete SEMPRE para cima (sem centavos quebrados)
    const shippingFee = Math.ceil(rawShippingFee);

    console.log('✅ Distância calculada:', distanceInKm, 'km');
    console.log('✅ Está chovendo:', settings.is_raining);
    console.log('✅ Valor por KM:', pricePerKm);
    console.log('✅ Frete bruto:', rawShippingFee, '→ arredondado:', shippingFee);

    const result: ShippingResponse = {
      distance_km: Math.round(distanceInKm * 100) / 100, // 2 casas decimais
      shipping_fee: shippingFee, // Valor inteiro (arredondado pra cima)
      duration_text: durationText,
      is_raining: settings.is_raining,
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erro ao calcular frete:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao calcular frete', details: error?.message || 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
