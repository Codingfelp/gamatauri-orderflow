import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductRow {
  name: string;
  price: number;
  category?: string;
  description?: string;
  image_url?: string;
  available?: boolean;
}

// Helper function to verify admin access
async function verifyAdminAccess(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { authorized: false, error: 'Unauthorized - No token provided' };
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return { authorized: false, error: 'Unauthorized - Invalid token' };
  }

  // Check admin role
  const { data: roles } = await supabaseClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin');

  if (!roles || roles.length === 0) {
    return { authorized: false, error: 'Forbidden - Admin access required' };
  }

  return { authorized: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify admin access
  const authCheck = await verifyAdminAccess(req);
  if (!authCheck.authorized) {
    return new Response(JSON.stringify({ error: authCheck.error }), {
      status: authCheck.error?.includes('Forbidden') ? 403 : 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { sheetsUrl } = await req.json();

    if (!sheetsUrl) {
      throw new Error('sheetsUrl is required');
    }

    // Convert Google Sheets edit/view URL to CSV export URL
    const sheetIdMatch = sheetsUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      throw new Error('Invalid Google Sheets URL format');
    }

    const sheetId = sheetIdMatch[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    // Fetch CSV data
    const csvResponse = await fetch(csvUrl);
    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch CSV: ${csvResponse.status} ${csvResponse.statusText}`);
    }

    const csvText = await csvResponse.text();

    // Parse CSV
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    const products: ProductRow[] = [];
    let skippedRows = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      const nameIndex = headers.indexOf('name');
      const priceIndex = headers.indexOf('price');
      const categoryIndex = headers.indexOf('category');
      const descriptionIndex = headers.indexOf('description');
      const imageUrlIndex = headers.indexOf('image_url');
      const activeIndex = headers.indexOf('active');
      
      if (nameIndex === -1 || priceIndex === -1) {
        throw new Error('CSV must contain "name" and "price" columns');
      }

      const name = values[nameIndex];
      const priceStr = values[priceIndex];

      if (!name || !priceStr) {
        skippedRows++;
        continue;
      }

      const price = parseFloat(priceStr);
      if (isNaN(price) || price < 0) {
        skippedRows++;
        continue;
      }

      const product: ProductRow = {
        name,
        price,
        category: categoryIndex !== -1 && values[categoryIndex] ? values[categoryIndex] : undefined,
        description: descriptionIndex !== -1 && values[descriptionIndex] ? values[descriptionIndex] : undefined,
        image_url: imageUrlIndex !== -1 && values[imageUrlIndex] ? values[imageUrlIndex] : undefined,
        available: activeIndex !== -1 ? values[activeIndex]?.toLowerCase() === 'true' : true,
      };

      products.push(product);
    }

    if (products.length === 0) {
      throw new Error('No valid products found in CSV');
    }

    // Insert products in batches of 100
    const batchSize = 100;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      const { data, error } = await supabaseClient
        .from('products')
        .insert(batch)
        .select();

      if (error) {
        errors += batch.length;
      } else {
        inserted += (data?.length || 0);
      }
    }

    const result = {
      success: true,
      inserted,
      errors,
      skipped: skippedRows,
      total_processed: products.length,
      message: `Successfully imported ${inserted} products from Google Sheets`,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
