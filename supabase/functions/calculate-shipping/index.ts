import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Regra de negócio: R$ 3,00 por KM, mínimo R$ 3,00
    const PRICE_PER_KM = 3.00;
    const MIN_FEE = 3.00;
    const shippingFee = Math.max(MIN_FEE, distanceInKm * PRICE_PER_KM);

    console.log('✅ Distância calculada:', distanceInKm, 'km');
    console.log('✅ Frete calculado:', shippingFee);

    const result: ShippingResponse = {
      distance_km: Math.round(distanceInKm * 100) / 100, // 2 casas decimais
      shipping_fee: Math.round(shippingFee * 100) / 100, // 2 casas decimais
      duration_text: durationText,
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
