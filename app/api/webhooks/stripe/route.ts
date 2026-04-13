import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify the webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Initialize Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // Get the customer ID from the session
      const customerId = session.customer as string

      if (!customerId) {
        console.error('No customer ID in checkout session')
        return NextResponse.json(
          { error: 'No customer ID in session' },
          { status: 400 }
        )
      }

      // Find the organization by stripe_customer_id
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (orgError || !org) {
        console.error('Organization not found for customer:', customerId, orgError)
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        )
      }

      // Update organization: subscription_status = 'active', subscription_tier = 'pro'
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          subscription_status: 'active',
          subscription_tier: 'pro',
          subscription_end_date: null,
        })
        .eq('id', org.id)

      if (updateError) {
        console.error('Error updating organization subscription:', updateError)
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        )
      }

      console.log(`✅ Subscription activated for org ${org.id} (customer: ${customerId})`)
    }

    // Handle customer.subscription.deleted
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription

      const customerId = subscription.customer as string

      if (!customerId) {
        console.error('No customer ID in subscription.deleted event')
        return NextResponse.json(
          { error: 'No customer ID in event' },
          { status: 400 }
        )
      }

      // Find the organization by stripe_customer_id
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (orgError || !org) {
        console.error('Organization not found for customer:', customerId, orgError)
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        )
      }

      // Update organization: subscription_status = 'canceled', subscription_tier = 'basic'
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          subscription_status: 'canceled',
          subscription_tier: 'basic',
          subscription_end_date: new Date().toISOString(),
        })
        .eq('id', org.id)

      if (updateError) {
        console.error('Error updating organization subscription:', updateError)
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        )
      }

      console.log(`❌ Subscription canceled for org ${org.id} (customer: ${customerId})`)
    }

    // Return success for all handled events
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
