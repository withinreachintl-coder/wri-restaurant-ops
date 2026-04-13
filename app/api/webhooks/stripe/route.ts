import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Bypass Next.js body parser so we can verify Stripe signature on raw bytes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Use service-role key so webhook can write without user session
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orgId = session.metadata?.orgId

    if (!orgId || orgId === 'unknown') {
      console.error('checkout.session.completed: missing orgId in metadata', session.id)
      return NextResponse.json({ received: true })
    }

    let subscriptionEndDate: string | null = null
    let stripeCustomerId: string | null = null
    let stripeSubscriptionId: string | null = null

    if (typeof session.customer === 'string') {
      stripeCustomerId = session.customer
    }

    if (typeof session.subscription === 'string') {
      stripeSubscriptionId = session.subscription
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        subscriptionEndDate = new Date(subscription.current_period_end * 1000).toISOString()
      } catch (err) {
        console.error('Failed to retrieve subscription:', err)
      }
    }

    const { error } = await supabase
      .from('organizations')
      .update({
        subscription_status: 'active',
        subscription_tier: 'paid',
        subscription_end_date: subscriptionEndDate,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
      })
      .eq('id', orgId)

    if (error) {
      console.error('Failed to update organization subscription status:', error)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    console.log(`Pro tier provisioned for org ${orgId}`)
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id

    const { error } = await supabase
      .from('organizations')
      .update({
        subscription_status: 'cancelled',
        subscription_tier: 'free',
        subscription_end_date: null,
        stripe_subscription_id: null,
      })
      .eq('stripe_customer_id', customerId)

    if (error) {
      console.error('Failed to downgrade org on subscription deletion:', error)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    console.log(`Subscription cancelled for Stripe customer ${customerId}`)
  }

  return NextResponse.json({ received: true })
}
