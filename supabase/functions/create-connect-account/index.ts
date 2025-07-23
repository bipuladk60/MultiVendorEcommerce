// supabase/functions/create-connect-account/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

// CORS headers to allow requests from your web app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle the preflight CORS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('Stripe secret key is not configured.');

    const origin = req.headers.get('origin');
    if (!origin) throw new Error("Request must have an origin header.");

    // 1. Create a new Stripe Express Account for the vendor
    const accountResponse = await fetch('https://api.stripe.com/v1/accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'type=express'
    });
    const account = await accountResponse.json();
    if (!accountResponse.ok) throw new Error(account.error.message);

    // 2. Create a unique onboarding link for that account
    const linkResponse = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        account: account.id,
        refresh_url: `${origin}/vendor/dashboard`,
        return_url: `${origin}/stripe-return?account_id=${account.id}`,
        type: 'account_onboarding',
      }).toString(),
    });
    const accountLink = await linkResponse.json();
    if (!linkResponse.ok) throw new Error(accountLink.error.message);

    // 3. Return the onboarding URL to the frontend
    return new Response(JSON.stringify({ url: accountLink.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-connect-account:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});