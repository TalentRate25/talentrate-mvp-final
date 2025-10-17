import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export const runtime = 'nodejs'

type Body = {
  credits: number
  priceIdEnv: string
}

export async function POST(req: Request) {
  try {
    const { credits, priceIdEnv } = (await req.json()) as Body
    if (!credits || !priceIdEnv) {
      return new NextResponse('Missing body', { status: 400 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2024-06-20',
    })

    // Get the logged-in user via Supabase cookie session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            // Extract cookies from request headers
            const cookieHeader = req.headers.get('cookie')
            if (!cookieHeader) return []
            
            return cookieHeader.split(';').map(cookie => {
              const [name, value] = cookie.trim().split('=')
              return { name, value }
            })
          },
          setAll() {},
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser() as { data: { user: any } }
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const priceId = process.env[priceIdEnv]
    if (!priceId) {
      return new NextResponse('Price not configured', { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`,
      line_items: [
        { price: priceId, quantity: 1 },
      ],
      customer_email: user.email || undefined,
      metadata: {
        supabase_user_id: user.id,
        credits: String(credits),
      },
    })

    return NextResponse.json({ id: session.id, url: session.url })
  } catch (e: any) {
    return new NextResponse(e?.message || 'Server error', { status: 500 })
  }
}


