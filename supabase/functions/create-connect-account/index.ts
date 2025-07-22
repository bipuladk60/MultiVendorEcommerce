import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    })
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    return new Response(
      JSON.stringify({ error: 'Stripe key not configured' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }

  try {
    const origin = req.headers.get('origin') || 'http://localhost:5173'

    // Create Stripe account using fetch
    const accountResponse = await fetch('https://api.stripe.com/v1/accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'type=express&capabilities[card_payments][requested]=true&capabilities[transfers][requested]=true'
    })

    const account = await accountResponse.json()
    
    if (!accountResponse.ok) {
      throw new Error(account.error?.message || 'Failed to create Stripe account')
    }

    // Create account link using fetch
    const linkResponse = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `account=${account.id}&refresh_url=${encodeURIComponent(`${origin}/dashboard`)}&return_url=${encodeURIComponent(`${origin}/stripe-return?account_id=${account.id}`)}&type=account_onboarding`
    })

    const link = await linkResponse.json()
    
    if (!linkResponse.ok) {
      throw new Error(link.error?.message || 'Failed to create account link')
    }

    return new Response(
      JSON.stringify({ url: link.url }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
}

serve(handler)