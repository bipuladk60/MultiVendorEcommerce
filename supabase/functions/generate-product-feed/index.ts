// supabase/functions/generate-product-feed/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';

const csvHeaders = {
  'Content-Type': 'text/csv; charset=utf-8',
  'Content-Disposition': 'attachment; filename="product_feed.csv"',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: csvHeaders });
  }

  try {
    const adminClient = createClient(
        Deno.env.get('PROJECT_URL')!,
        Deno.env.get('SERVICE_KEY')!
    );

    // Fetch ONLY products explicitly marked as 'is_promoted = TRUE'
    const { data: products, error } = await adminClient
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        vendor_id,
        vendor:profiles!products_vendor_id_fkey(
            business_name
        )
      `)
      .eq('is_promoted', true) // The only filter needed
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch promoted products for feed: ${error.message}`);
    
    const productsForFeed = products || [];

    // If no products are promoted, return a CSV with just the header
    if (productsForFeed.length === 0) {
        return new Response('id,title,description,link,image_link,price,availability,brand,custom_label_0\n', {
            headers: csvHeaders,
        });
    }

    let csvContent = 'id,title,description,link,image_link,price,availability,brand,custom_label_0\n';
    const baseUrl = Deno.env.get('FRONTEND_BASE_URL');
    if (!baseUrl) {
      throw new Error('FRONTEND_BASE_URL environment variable is not set.');
    }
    
    products.forEach(product => {
        const productLink = `${baseUrl}/products/${product.id}`; // This will now use your Vercel URL
        // ...
    });
    
    productsForFeed.forEach(product => {
        const productLink = `${baseUrl}/products/${product.id}`;
        const brand = product.vendor?.business_name || 'AmazonClone';
        const customLabel0 = product.vendor_id; // Vendor ID for campaign segmentation

        const escapeCsv = (value) => {
            if (value === null || value === undefined) return '';
            let str = String(value);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        csvContent += [
            escapeCsv(product.id),
            escapeCsv(product.name),
            escapeCsv(product.description),
            escapeCsv(productLink),
            escapeCsv(product.image_url || 'https://via.placeholder.com/300'),
            `${parseFloat(product.price).toFixed(2)} USD`,
            'in stock',
            escapeCsv(brand),
            escapeCsv(customLabel0)
        ].join(',') + '\n';
    });

    return new Response(csvContent, { headers: csvHeaders, status: 200 });
  } catch (error) {
    console.error("Error generating product feed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500,
    });
  }
});