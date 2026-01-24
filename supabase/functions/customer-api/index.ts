import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

// Validate API key from headers or query params
function validateApiKey(req: Request): boolean {
  const url = new URL(req.url);
  const headerApiKey = req.headers.get('x-api-key');
  const headerWebhook = req.headers.get('x-webhook-secret');
  const queryKey = url.searchParams.get('key');
  
  // Aceita WEBHOOK_SECRET ou EXTERNAL_SYSTEM_WEBHOOK_SECRET
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
  const externalWebhookSecret = Deno.env.get('EXTERNAL_SYSTEM_WEBHOOK_SECRET');
  
  // Debug logs (sem expor valores reais)
  console.log('[customer-api] Auth check:', {
    hasHeaderApiKey: !!headerApiKey,
    hasHeaderWebhook: !!headerWebhook,
    hasQueryKey: !!queryKey,
    hasWebhookSecret: !!webhookSecret,
    hasExternalWebhookSecret: !!externalWebhookSecret
  });
  
  if (!webhookSecret && !externalWebhookSecret) {
    console.error('[customer-api] No webhook secret configured (WEBHOOK_SECRET or EXTERNAL_SYSTEM_WEBHOOK_SECRET)');
    return false;
  }
  
  const providedKey = headerApiKey || headerWebhook || queryKey;
  
  if (!providedKey) {
    console.error('[customer-api] No API key provided in request');
    return false;
  }
  
  // Valida contra qualquer um dos secrets configurados
  const isValid = providedKey === webhookSecret || providedKey === externalWebhookSecret;
  
  if (!isValid) {
    console.error('[customer-api] API key mismatch');
  } else {
    console.log('[customer-api] API key validated successfully');
  }
  
  return isValid;
}

Deno.serve(async (req) => {
  console.log(`[customer-api] ${req.method} request received`);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    if (!validateApiKey(req)) {
      console.error('[customer-api] Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Extract path segments (e.g., /customer-api/123/addresses)
    const customerId = pathParts.length > 1 ? pathParts[1] : null;
    const subResource = pathParts.length > 2 ? pathParts[2] : null;

    // Check for dedicated addresses endpoint: GET /customer-api/{user_id}/addresses
    if (req.method === 'GET' && customerId && customerId !== 'customer-api' && subResource === 'addresses') {
      console.log(`[customer-api] Fetching addresses for customer: ${customerId}`);
      
      // Find customer first to get user_id
      let userId = customerId;
      
      // If not a UUID, find the user_id
      if (!customerId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        let findQuery = supabase.from('profiles').select('user_id');
        
        if (customerId.includes('@')) {
          findQuery = findQuery.eq('email', customerId);
        } else {
          const normalizedPhone = customerId.replace(/\D/g, '');
          findQuery = findQuery.ilike('phone', `%${normalizedPhone}%`);
        }
        
        const { data: customer, error } = await findQuery.single();
        
        if (error || !customer) {
          return new Response(
            JSON.stringify({ error: 'Customer not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        userId = customer.user_id;
      }
      
      // Fetch all addresses for this customer
      const { data: addresses, error } = await supabase
        .from('user_addresses')
        .select('id, street, number, complement, neighborhood, city, state, is_primary, distance_km, shipping_fee, created_at, updated_at')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false });
      
      if (error) {
        console.error('[customer-api] Error fetching addresses:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch addresses', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          user_id: userId,
          addresses: addresses || [],
          total: addresses?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET - List all customers or get specific customer
    if (req.method === 'GET') {
      if (customerId && customerId !== 'customer-api') {
        // Get specific customer by ID or email or phone
        console.log(`[customer-api] Fetching customer: ${customerId}`);
        
        let query = supabase
          .from('profiles')
          .select('id, user_id, name, email, phone, cpf, address, shipping_fee, favorite_products, created_at, updated_at');
        
        // Check if customerId is UUID, email, or phone
        if (customerId.includes('@')) {
          query = query.eq('email', customerId);
        } else if (customerId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          query = query.eq('user_id', customerId);
        } else {
          // Assume it's a phone number - normalize it
          const normalizedPhone = customerId.replace(/\D/g, '');
          query = query.ilike('phone', `%${normalizedPhone}%`);
        }
        
        const { data: customer, error } = await query.single();
        
        if (error) {
          console.error('[customer-api] Error fetching customer:', error);
          return new Response(
            JSON.stringify({ error: 'Customer not found', details: error.message }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch addresses for this customer
        const { data: addresses } = await supabase
          .from('user_addresses')
          .select('id, street, number, complement, neighborhood, city, state, is_primary, distance_km, shipping_fee, created_at, updated_at')
          .eq('user_id', customer.user_id)
          .order('is_primary', { ascending: false });
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            customer: {
              ...customer,
              addresses: addresses || []
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // List all customers with optional filters
        console.log('[customer-api] Listing all customers');
        
        // Increased default limit to 1000 to fetch all customers
        const limit = parseInt(url.searchParams.get('limit') || '1000');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const search = url.searchParams.get('search');
        const includeAddresses = url.searchParams.get('include_addresses') !== 'false'; // Default true
        
        let query = supabase
          .from('profiles')
          .select('id, user_id, name, email, phone, cpf, address, shipping_fee, favorite_products, created_at, updated_at', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        
        if (search) {
          query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }
        
        const { data: customers, error, count } = await query;
        
        if (error) {
          console.error('[customer-api] Error listing customers:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to list customers', details: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let enrichedCustomers = customers || [];

        // Fetch addresses for all customers if requested
        if (includeAddresses && customers && customers.length > 0) {
          const userIds = customers.map(c => c.user_id);
          
          const { data: allAddresses } = await supabase
            .from('user_addresses')
            .select('id, user_id, street, number, complement, neighborhood, city, state, is_primary, distance_km, shipping_fee, created_at, updated_at')
            .in('user_id', userIds)
            .order('is_primary', { ascending: false });

          // Map addresses to each customer
          const addressMap = new Map<string, any[]>();
          (allAddresses || []).forEach(addr => {
            const existing = addressMap.get(addr.user_id) || [];
            existing.push(addr);
            addressMap.set(addr.user_id, existing);
          });

          enrichedCustomers = customers.map(customer => ({
            ...customer,
            addresses: addressMap.get(customer.user_id) || []
          }));
        }

        const totalCount = count || 0;
        const hasMore = offset + limit < totalCount;
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            customers: enrichedCustomers, 
            total: totalCount,
            limit,
            offset,
            has_more: hasMore,
            total_pages: Math.ceil(totalCount / limit),
            current_page: Math.floor(offset / limit) + 1
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // PUT/PATCH - Update customer
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = await req.json();
      console.log('[customer-api] Update request body:', JSON.stringify(body));
      
      // Find customer by user_id, email, or phone
      const { user_id, email, phone, ...updateData } = body;
      
      if (!user_id && !email && !phone) {
        return new Response(
          JSON.stringify({ error: 'Must provide user_id, email, or phone to identify customer' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Build the query to find the customer
      let findQuery = supabase.from('profiles').select('id, user_id');
      if (user_id) {
        findQuery = findQuery.eq('user_id', user_id);
      } else if (email) {
        findQuery = findQuery.eq('email', email);
      } else if (phone) {
        const normalizedPhone = phone.replace(/\D/g, '');
        findQuery = findQuery.ilike('phone', `%${normalizedPhone}%`);
      }
      
      const { data: existingCustomer, error: findError } = await findQuery.single();
      
      if (findError || !existingCustomer) {
        console.error('[customer-api] Customer not found for update:', findError);
        return new Response(
          JSON.stringify({ error: 'Customer not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Prepare update data - only allow specific fields
      const allowedFields = ['name', 'phone', 'cpf', 'address', 'shipping_fee', 'favorite_products'];
      const sanitizedUpdate: Record<string, any> = {};
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          sanitizedUpdate[field] = updateData[field];
        }
      }
      
      // Add updated_at timestamp
      sanitizedUpdate.updated_at = new Date().toISOString();
      
      console.log(`[customer-api] Updating customer ${existingCustomer.user_id} with:`, JSON.stringify(sanitizedUpdate));
      
      const { data, error } = await supabase
        .from('profiles')
        .update(sanitizedUpdate)
        .eq('user_id', existingCustomer.user_id)
        .select()
        .single();
      
      if (error) {
        console.error('[customer-api] Error updating customer:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update customer', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('[customer-api] Customer updated successfully');
      return new Response(
        JSON.stringify({ success: true, customer: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Set favorite products for a customer
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('[customer-api] POST request body:', JSON.stringify(body));
      
      const { user_id, email, phone, favorite_products, action } = body;
      
      if (!user_id && !email && !phone) {
        return new Response(
          JSON.stringify({ error: 'Must provide user_id, email, or phone to identify customer' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Find customer
      let findQuery = supabase.from('profiles').select('id, user_id, favorite_products');
      if (user_id) {
        findQuery = findQuery.eq('user_id', user_id);
      } else if (email) {
        findQuery = findQuery.eq('email', email);
      } else if (phone) {
        const normalizedPhone = phone.replace(/\D/g, '');
        findQuery = findQuery.ilike('phone', `%${normalizedPhone}%`);
      }
      
      const { data: existingCustomer, error: findError } = await findQuery.single();
      
      if (findError || !existingCustomer) {
        return new Response(
          JSON.stringify({ error: 'Customer not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      let newFavorites: string[] = [];
      const currentFavorites = existingCustomer.favorite_products || [];
      
      if (action === 'add' && favorite_products) {
        // Add products to favorites (avoiding duplicates)
        const toAdd = Array.isArray(favorite_products) ? favorite_products : [favorite_products];
        newFavorites = [...new Set([...currentFavorites, ...toAdd])];
      } else if (action === 'remove' && favorite_products) {
        // Remove products from favorites
        const toRemove = Array.isArray(favorite_products) ? favorite_products : [favorite_products];
        newFavorites = currentFavorites.filter((id: string) => !toRemove.includes(id));
      } else if (action === 'set' || !action) {
        // Replace entire favorites list
        newFavorites = Array.isArray(favorite_products) ? favorite_products : [];
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          favorite_products: newFavorites,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', existingCustomer.user_id)
        .select()
        .single();
      
      if (error) {
        console.error('[customer-api] Error updating favorites:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update favorites', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, customer: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[customer-api] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
