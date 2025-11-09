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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    console.log('Received sheets URL:', sheetsUrl);

    // Convert Google Sheets edit/view URL to CSV export URL
    const sheetIdMatch = sheetsUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      throw new Error('Invalid Google Sheets URL format');
    }

    const sheetId = sheetIdMatch[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    
    console.log('Converted to CSV URL:', csvUrl);

    // Fetch CSV data
    const csvResponse = await fetch(csvUrl);
    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch CSV: ${csvResponse.status} ${csvResponse.statusText}`);
    }

    const csvText = await csvResponse.text();
    console.log('CSV fetched successfully, size:', csvText.length, 'bytes');

    // Parse CSV
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('CSV headers:', headers);

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

      // Skip rows without name or price
      if (!name || !priceStr) {
        skippedRows++;
        continue;
      }

      const price = parseFloat(priceStr);
      if (isNaN(price) || price <= 0) {
        console.warn(`Skipping row ${i + 1}: invalid price "${priceStr}"`);
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

    console.log(`Parsed ${products.length} products, skipped ${skippedRows} invalid rows`);

    if (products.length === 0) {
      throw new Error('No valid products found in CSV');
    }

    // Insert products in batches of 100
    const batchSize = 100;
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}`);

      const { data, error } = await supabaseClient
        .from('products')
        .insert(batch)
        .select();

      if (error) {
        console.error('Batch insert error:', error);
        errors += batch.length;
      } else {
        const batchInserted = data?.length || 0;
        inserted += batchInserted;
        console.log(`Batch processed: ${batchInserted} products`);
      }
    }

    const result = {
      success: true,
      inserted,
      updated,
      errors,
      skipped: skippedRows,
      total_processed: products.length,
      message: `Successfully imported ${inserted} products from Google Sheets`,
    };

    console.log('Import completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error importing products:', error);
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
