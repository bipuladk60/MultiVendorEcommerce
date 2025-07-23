// supabase/functions/create-payment-intent/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== Payment Intent Function Started ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log environment variables (without revealing secrets)
    console.log('Environment check:');
    console.log('- PROJECT_URL exists:', !!Deno.env.get('PROJECT_URL'));
    console.log('- SERVICE_KEY exists:', !!Deno.env.get('SERVICE_KEY'));
    console.log('- STRIPE_SECRET_KEY exists:', !!Deno.env.get('STRIPE_SECRET_KEY'));

    // Create an Admin client to securely query our database
    const adminClient = createClient(
        Deno.env.get('PROJECT_URL')!,
        Deno.env.get('SERVICE_KEY')!
    );

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body received:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { amount, vendor_id } = requestBody;
    console.log('Extracted values:', { amount, vendor_id, type_amount: typeof amount, type_vendor_id: typeof vendor_id });
    
    if (!amount || !vendor_id) {
      const error = "Amount and Vendor ID are required.";
      console.error('Validation error:', error);
      throw new Error(error);
    }

    if (amount <= 0) {
      const error = "Amount must be greater than 0.";
      console.error('Validation error:', error);
      throw new Error(error);
    }

    // 1. Fetch the vendor's Stripe account ID from our database
    console.log('Querying database for vendor profile...');
    console.log('Vendor ID:', vendor_id);
    
    const { data: vendorProfile, error: profileError } = await adminClient
        .from('profiles')
        .select('stripe_account_id, id, role')
        .eq('id', vendor_id)
        .single();
        
    console.log('Database query result:');
    console.log('- vendorProfile:', vendorProfile);
    console.log('- profileError:', profileError);
    
    if (profileError) {
        console.error('Database error details:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        });
        throw new Error(`Database error: ${profileError.message}`);
    }
    
    if (!vendorProfile) {
        const error = "Vendor not found in database.";
        console.error('Error:', error);
        throw new Error(error);
    }
    
    if (!vendorProfile.stripe_account_id) {
        const error = "This vendor is not connected to Stripe and cannot receive payments.";
        console.error('Error:', error, 'Vendor profile:', vendorProfile);
        throw new Error(error);
    }
    
    const stripeAccountId = vendorProfile.stripe_account_id;
    console.log('Found Stripe account ID:', stripeAccountId);
    
    // Calculate amounts in cents
    const amountInCents = Math.round(amount * 100);
    const platformFeeInCents = Math.round(amountInCents * 0.10); // 10% platform fee
    
    console.log('Payment calculation:', { 
      originalAmount: amount,
      amountInCents, 
      platformFeeInCents,
      vendorReceives: amountInCents - platformFeeInCents 
    });

    // 2. Create the Payment Intent using fetch
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      const error = "Stripe secret key is not configured.";
      console.error('Error:', error);
      throw new Error(error);
    }

    console.log('Creating Stripe Payment Intent...');
    console.log('Stripe key length:', stripeKey.length);
    console.log('First few chars of key:', stripeKey.substring(0, 7) + '...');

    const stripePayload = {
        amount: String(amountInCents),
        currency: 'usd',
        application_fee_amount: String(platformFeeInCents),
        'transfer_data[destination]': stripeAccountId,
        'metadata[vendor_id]': vendor_id,
    };
    
    console.log('Stripe payload:', stripePayload);

    const paymentIntentResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(stripePayload).toString(),
    });

    console.log('Stripe API response status:', paymentIntentResponse.status);
    console.log('Stripe API response headers:', Object.fromEntries(paymentIntentResponse.headers.entries()));

    const paymentIntent = await paymentIntentResponse.json();
    console.log('Stripe API response body:', paymentIntent);
    
    if (!paymentIntentResponse.ok) {
      const errorMessage = paymentIntent?.error?.message || 'Unknown Stripe error';
      const errorCode = paymentIntent?.error?.code || 'unknown';
      const errorType = paymentIntent?.error?.type || 'unknown';
      
      console.error('Stripe API error details:', {
        status: paymentIntentResponse.status,
        message: errorMessage,
        code: errorCode,
        type: errorType,
        fullError: paymentIntent
      });
      
      throw new Error(`Stripe error: ${errorMessage} (${errorCode})`);
    }
    
    if (!paymentIntent.client_secret) {
      console.error('No client secret in successful response:', paymentIntent);
      throw new Error('No client secret received from Stripe');
    }
    
    console.log('Payment Intent created successfully');
    console.log('Client secret received (first 20 chars):', paymentIntent.client_secret.substring(0, 20) + '...');
    
    const response = {
      clientSecret: paymentIntent.client_secret,
      amount: amountInCents,
      platformFee: platformFeeInCents
    };
    
    console.log('Returning response:', { ...response, clientSecret: 'HIDDEN' });
    
    // 3. Return the client secret to the frontend
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("=== ERROR in create-payment-intent ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});