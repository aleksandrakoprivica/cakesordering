// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Check if Stripe secret key is configured
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeSecretKey) {
    console.error('STRIPE_SECRET_KEY is not set')
    return new Response(
      JSON.stringify({ error: 'Stripe secret key not configured' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }

  try {
    const {
      totalRsd,
      items,
      customerEmail,
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryCity,
      deliveryPostalCode,
      deliveryNotes,
    } = await req.json()

    // Convert RSD to EUR (Stripe doesn't support RSD directly)
    // 1 RSD ≈ 0.0085 EUR (update this rate as needed)
    const exchangeRate = 0.0085

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.cakeName,
          },
          unit_amount: Math.round(item.unitPriceRsd * exchangeRate * 100), // Convert to cents
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `cakesordering://payment?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `cakesordering://payment?canceled=true`,
      customer_email: customerEmail,
      metadata: {
        customerName,
        customerPhone,
        deliveryAddress,
        deliveryCity,
        deliveryPostalCode,
        deliveryNotes: deliveryNotes || '',
        totalRsd: totalRsd.toString(),
      },
    })

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
