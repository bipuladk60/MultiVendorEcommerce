// Follow Supabase Edge Function example for Stripe
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function handleStripeConnect(req: Request) {
  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Get JWT token
    const token = authHeader.replace('Bearer ', '')
    
    // Call Supabase auth API to get user
    const userResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: Deno.env.get('SUPABASE_ANON_KEY') || '',
      },
    })

    if (!userResponse.ok) {
      throw new Error('Invalid user token')
    }

    const userData = await userResponse.json()
    if (!userData.id) {
      throw new Error('User ID not found')
    }

    // Create Stripe account
    const stripeResponse = await fetch('https://api.stripe.com/v1/accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2023-10-16',
      },
      body: new URLSearchParams({
        type: 'express',
        'capabilities[card_payments][requested]': 'true',
        'capabilities[transfers][requested]': 'true',
      }).toString(),
    })

    const stripeData = await stripeResponse.json()
    if (!stripeResponse.ok) {
      throw new Error(stripeData.error?.message || 'Failed to create Stripe account')
    }

    // Update user profile in Supabase
    const updateResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/profiles?id=eq.${userData.id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          stripe_account_id: stripeData.id
        })
      }
    )

    if (!updateResponse.ok) {
      const updateError = await updateResponse.text()
      console.error('Profile update error:', updateError)
      throw new Error(`Failed to update profile: ${updateError}`)
    }

    // Create account link
    const origin = req.headers.get('origin') || 'http://localhost:5173'
    const linkResponse = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2023-10-16',
      },
      body: new URLSearchParams({
        account: stripeData.id,
        refresh_url: `${origin}/dashboard`,
        return_url: `${origin}/stripe-return?account_id=${stripeData.id}`,
        type: 'account_onboarding',
      }).toString(),
    })

    const linkData = await linkResponse.json()
    if (!linkResponse.ok) {
      throw new Error(linkData.error?.message || 'Failed to create account link')
    }

    return new Response(
      JSON.stringify({ url: linkData.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Stripe Connect Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method === 'POST') {
    return await handleStripeConnect(req)
  }

  return new Response('Method not allowed', {
    headers: corsHeaders,
    status: 405,
  })
}) 