'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function BillingPage() {
  const [loading, setLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'pro'>('free')
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null)
  const [itemCount, setItemCount] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showCanceled, setShowCanceled] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      setShowSuccess(true)
    }
    if (params.get('canceled') === 'true') {
      setShowCanceled(true)
    }

    loadSubscriptionStatus()
  }, [])

  const loadSubscriptionStatus = async () => {
    setLoading(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error('No authenticated user:', authError)
        setLoading(false)
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', user.id)
        .single()

      if (userError || !userData?.org_id) {
        console.error('Error fetching user org:', userError)
        setLoading(false)
        return
      }

      // Fetch org subscription status
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('subscription_status, subscription_tier, subscription_end_date')
        .eq('id', userData.org_id)
        .single()

      if (orgError) {
        console.error('Error fetching org subscription:', orgError)
        setLoading(false)
        return
      }

      // Fetch checklist item count
      const { count: itemsCount, error: itemsError } = await supabase
        .from('checklist_items')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', userData.org_id)

      if (!itemsError && itemsCount !== null) {
        setItemCount(itemsCount)
      }

      const isPro = orgData?.subscription_status === 'active' || orgData?.subscription_tier === 'paid'
      setSubscriptionStatus(isPro ? 'pro' : 'free')

      if (isPro && orgData?.subscription_end_date) {
        setNextBillingDate(new Date(orgData.subscription_end_date).toLocaleDateString())
      }
    } catch (err) {
      console.error('Failed to load subscription:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const { url, error } = await response.json()

      if (error) {
        alert(`Error: ${error}`)
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (err) {
      console.error('Failed to create checkout session:', err)
      alert('Failed to start checkout. Please try again.')
    }
  }

  const handleUpgradeStripe = () => {
    window.location.href = 'https://buy.stripe.com/28E5kC8lr0gJaYLcqZ9k403'
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your Pro subscription? You will lose access to unlimited checklist items at the end of your billing period.')) {
      return
    }

    alert('Subscription cancellation will be implemented soon. Please contact support@wireach.tools for now.')
  }

  if (loading) {
    return (
      <main style={{ background: '#1C1917', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
            fontSize: '14px',
            fontWeight: 300,
            color: '#A89880',
          }}
        >
          Loading billing information...
        </div>
      </main>
    )
  }

  const usagePercent = Math.min((itemCount / 10) * 100, 100)
  const isAtLimit = itemCount >= 10

  return (
    <main style={{ background: '#1C1917', minHeight: '100vh', color: '#F5F0E8' }}>
      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              fontSize: '28px',
              fontWeight: 700,
              color: '#F5F0E8',
              margin: 0,
            }}
          >
            Billing &amp; Subscription
          </h1>
          <Link
            href="/dashboard"
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: '#D97706',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
            className="hover:opacity-80 transition-opacity"
          >
            &larr; Dashboard
          </Link>
        </div>

        {/* Warning Banner - Show if at limit */}
        {isAtLimit && subscriptionStatus === 'free' && (
          <div
            style={{
              background: 'rgba(217,119,6,0.15)',
              border: '1px solid #D97706',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <span style={{ color: '#D97706', fontSize: '16px', marginTop: '2px', flexShrink: 0 }}>⚠️</span>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#D97706',
                  marginBottom: '4px',
                }}
              >
                You've reached your free plan limit.
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '13px',
                  fontWeight: 300,
                  color: '#A89880',
                }}
              >
                Upgrade to Pro to add unlimited checklist items.
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div
            style={{
              background: 'rgba(217,119,6,0.12)',
              border: '1px solid rgba(217,119,6,0.3)',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ color: '#D97706' }}>✓</span>
            <span
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#D97706',
              }}
            >
              Success! Your subscription is now active.
            </span>
          </div>
        )}

        {/* Canceled Message */}
        {showCanceled && (
          <div
            style={{
              background: 'rgba(167,139,250,0.1)',
              border: '1px solid rgba(167,139,250,0.2)',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ color: '#A78BFA' }}>⚠</span>
            <span
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#A78BFA',
              }}
            >
              Checkout was canceled. No charges were made.
            </span>
          </div>
        )}

        {/* Usage Card */}
        <div
          style={{
            background: '#292524',
            border: '1px solid #3F3935',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '32px',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: '#A89880',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              margin: '0 0 16px 0',
            }}
          >
            Checklist Items
          </h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '32px',
                fontWeight: 700,
                color: '#F5F0E8',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {itemCount}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                color: '#A89880',
              }}
            >
              / 10
            </div>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              height: '8px',
              background: '#3F3935',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid #57534E',
            }}
          >
            <div
              style={{
                height: '100%',
                background: '#D97706',
                width: `${usagePercent}%`,
                transition: 'width 0.3s ease',
                borderRadius: '3px',
              }}
            />
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '32px',
          }}
        >
          {/* Free Plan Card */}
          <div
            style={{
              background: '#292524',
              border: '2px solid #D97706',
              borderRadius: '8px',
              padding: '28px',
              position: 'relative',
            }}
          >
            {subscriptionStatus === 'free' && (
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '24px',
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '10px',
                  fontWeight: 500,
                  color: '#1C1917',
                  background: '#D97706',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Current plan
              </div>
            )}

            <h3
              style={{
                fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                fontSize: '22px',
                fontWeight: 600,
                color: '#F5F0E8',
                margin: '0 0 12px 0',
              }}
            >
              Free Plan
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 300,
                color: '#A89880',
                margin: '0 0 24px 0',
              }}
            >
              Up to 10 checklist items
            </p>

            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '0',
              }}
            >
              {[
                'Opening & closing checklists',
                'Staff completion tracking',
                'Manager dashboard',
                'Photo uploads',
              ].map((feature, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                    fontSize: '14px',
                    fontWeight: 300,
                    color: '#F5F0E8',
                    marginBottom: '14px',
                  }}
                >
                  <span style={{ color: '#D97706', marginTop: '2px', flexShrink: 0 }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Plan Card */}
          <div
            style={{
              background: '#292524',
              border: '2px solid #D97706',
              borderRadius: '8px',
              padding: '28px',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                right: '24px',
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '10px',
                fontWeight: 500,
                color: '#1C1917',
                background: '#D97706',
                padding: '4px 12px',
                borderRadius: '4px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Best value
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                fontSize: '22px',
                fontWeight: 600,
                color: '#F5F0E8',
                margin: '0 0 12px 0',
              }}
            >
              Pro Plan
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 300,
                color: '#A89880',
                margin: '0 0 24px 0',
              }}
            >
              $19/month — Unlimited everything
            </p>

            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 24px 0',
              }}
            >
              {[
                'Unlimited checklist items',
                'LP Audit forms',
                'R&M request tracking',
                'Priority support',
                'All Free features',
              ].map((feature, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                    fontSize: '14px',
                    fontWeight: 300,
                    color: '#F5F0E8',
                    marginBottom: '14px',
                  }}
                >
                  <span style={{ color: '#D97706', marginTop: '2px', flexShrink: 0 }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            {subscriptionStatus === 'free' && (
              <button
                onClick={handleUpgradeStripe}
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#1C1917',
                  background: '#D97706',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '14px 24px',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease',
                }}
                className="hover:opacity-90"
              >
                Upgrade to Pro
              </button>
            )}

            {subscriptionStatus === 'pro' && nextBillingDate && (
              <div
                style={{
                  background: '#3F3935',
                  border: '1px solid #57534E',
                  borderRadius: '6px',
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                    fontSize: '12px',
                    fontWeight: 400,
                    color: '#A89880',
                    marginBottom: '6px',
                  }}
                >
                  Next billing date
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#F5F0E8',
                  }}
                >
                  {nextBillingDate}
                </div>
              </div>
            )}

            {subscriptionStatus === 'pro' && (
              <button
                onClick={handleCancelSubscription}
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#A89880',
                  background: 'transparent',
                  border: '1px solid #57534E',
                  borderRadius: '4px',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  marginTop: '16px',
                  transition: 'opacity 0.2s ease',
                }}
                className="hover:opacity-80"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>

        {/* Support Footer */}
        <div style={{ textAlign: 'center', paddingTop: '24px', borderTop: '1px solid #3F3935' }}>
          <p
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 300,
              color: '#A89880',
              margin: 0,
            }}
          >
            Questions about billing? Contact{' '}
            <a
              href="mailto:support@wireach.tools"
              style={{ color: '#D97706', textDecoration: 'none' }}
              className="hover:opacity-80 transition-opacity"
            >
              support@wireach.tools
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
