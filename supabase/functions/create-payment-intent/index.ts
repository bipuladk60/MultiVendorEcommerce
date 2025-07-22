// supabase/functions/create-payment-intent/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.15.0';

const stripe = new Stripe(/* ... */);
const supabaseAdmin = createClient(/* ... */);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // **THE FIX:** Handle preflight requests immediately.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount, vendor_id } = await req.json();
    if (!amount || !vendor_id) throw new Error('Amount and Vendor ID are required.');
    
    // ... rest of your logic to fetch profile and create payment intent ...
    const { data: vendorProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', vendor_id)
      .single();

    if (profileError || !vendorProfile?.stripe_account_id) {
      throw new Error('Vendor is not connected to Stripe or not found.');
    }
    
    const stripeAccountId = vendorProfile.stripe_account_id;
    const platformFee = Math.round(amount * 100) * 0.10;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      application_fee_amount: Math.round(platformFee),
      transfer_data: {
        destination: stripeAccountId,
      },
    });

    return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
      // **THE FIX:** Add CORS headers to the success response.
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      // **THE FIX:** Add CORS headers to the error response.
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});