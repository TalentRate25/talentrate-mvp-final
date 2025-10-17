import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const CREDIT_MAP: Record<string, number> = {
  // Fill from env at runtime in handler
}

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2024-06-20',
  })

  const sig = req.headers.get('stripe-signature')
  if (!sig) return new NextResponse('Missing signature', { status: 400 })

  const buf = Buffer.from(await req.arrayBuffer())

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // Build priceId -> credits map from env
  const price50 = process.env.STRIPE_PRICE_CREDITS_50
  const price200 = process.env.STRIPE_PRICE_CREDITS_200
  const price500 = process.env.STRIPE_PRICE_CREDITS_500
  const priceToCredits: Record<string, number> = {}
  if (price50) priceToCredits[price50] = 50
  if (price200) priceToCredits[price200] = 200
  if (price500) priceToCredits[price500] = 500

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const supabase = await createClient()

    let email = session.customer_details?.email || session.customer_email || ''

    // Derive credits from line items/prices
    let creditsToAdd = 0
    if (session.mode === 'payment') {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
      for (const item of lineItems.data) {
        const priceId = (item.price && typeof item.price !== 'string') ? item.price.id : undefined
        if (priceId && priceToCredits[priceId]) {
          creditsToAdd += priceToCredits[priceId] * (item.quantity || 1)
        }
      }
    }

    // Fallback to metadata if provided
    if (!creditsToAdd && session.metadata?.credits) {
      const parsed = parseInt(session.metadata.credits, 10)
      if (!Number.isNaN(parsed)) creditsToAdd = parsed
    }

    // Find or create profile by email
    if (!email) {
      return new NextResponse('No email on session', { status: 200 })
    }

    // Get user from auth by email (not directly accessible). We store by email in profiles.
    // Upsert profile on email only; id can be set on first login.
    const { data: profile } = await supabase
      .from('profiles')
      .upsert({ email }, { onConflict: 'email' })
      .select()
      .single()

    // Insert credit ledger
    if (creditsToAdd > 0) {
      await supabase.from('credit_ledger').insert({
        user_id: profile?.id || null,
        delta: creditsToAdd,
        reason: 'purchase',
        stripe_payment_id: session.payment_intent as string | null,
      })
    }
  }

  return new NextResponse('OK', { status: 200 })
}

export async function GET() {
  return new NextResponse('OK')
}


