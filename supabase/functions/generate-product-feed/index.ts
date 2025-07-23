// supabase/functions/generate-product-feed/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';

// Headers for the CSV response
const csvHeaders = {
  'Content-Type': 'text/csv; charset=utf-8',
  'Content-Disposition': 'attachment; filename="product_feed.csv"',
  'Access-Control-Allow-Origin': '*', // Allow access from anywhere for Google Merchant Center
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: csvHeaders });
  }

  try {
    // Create a Supabase client with admin privileges to read all products
    const adminClient = createClient(
        Deno.env.get('PROJECT_URL')!,
        Deno.env.get('SERVICE_KEY')!
    );

    // Fetch all products with their vendor's business name
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
      `);

    if (error) throw new Error(`Failed to fetch products: ${error.message}`);
    if (!products || products.length === 0) {
        return new Response('id,title,description,link,image_link,price,availability,brand\n', {
            headers: csvHeaders,
        });
    }

    // Generate the CSV content
    let csvContent = 'id,title,description,link,image_link,price,availability,brand\n'; // CSV Header
    const baseUrl = req.headers.get('x-forwarded-proto') + '://' + req.headers.get('x-forwarded-host') || 'http://localhost:5173'; // Dynamically get your Vercel URL
    
    products.forEach(product => {
        const productLink = `${baseUrl}/products/${product.id}`; // Assuming you'll have a product detail page
        const brand = product.vendor?.business_name || 'AmazonClone'; // Use vendor name as brand

        // Escape commas and quotes in CSV fields
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
            escapeCsv(product.image_url || 'https://via.placeholder.com/300'), // Placeholder if no image
            `${product.price} USD`, // Price format
            'in stock', // Availability (hardcoded for MVP)
            escapeCsv(brand),
        ].join(',') + '\n';
    });

    // Return the CSV file
    return new Response(csvContent, {
      headers: csvHeaders,
      status: 200,
    });

  } catch (error) {
    console.error("Error generating product feed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500,
    });
  }
});