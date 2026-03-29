'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function BillingPage() {
  const [loading, setLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'pro'>('free')
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null)
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

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your Pro subscription? You will lose access to unlimited checklist items at the end of your billing period.')) {
      return
    }

    alert('Subscription cancellation will be implemented soon. Please contact support@wireach.tools for now.')
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAF9' }}>
        <div
          style={{
            fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
            fontSize: '14px',
            fontWeight: 300,
            color: '#6B5B4E',
          }}
        >
          Loading billing information...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen" style={{ background: '#FAFAF9', color: '#1C1917' }}>
      <div className="max-w-3xl mx-auto" style={{ padding: '48px 24px' }}>
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '32px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              fontSize: '28px',
              fontWeight: 700,
            }}
          >
            Billing &amp; Subscription
          </h1>
          <Link
            href="/dashboard"
            className="hover:opacity-80 transition-opacity"
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: '#D97706',
              textDecoration: 'none',
            }}
          >
            &larr; Dashboard
          </Link>
        </div>

        {/* Success */}
        {showSuccess && (
          <div
            style={{
              background: 'rgba(217,119,6,0.08)',
              border: '1px solid rgba(217,119,6,0.2)',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ color: '#D97706' }}>&#10003;</span>
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

        {/* Canceled */}
        {showCanceled && (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ color: '#78716C' }}>&#9888;</span>
            <span
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#78716C',
              }}
            >
              Checkout was canceled. No charges were made.
            </span>
          </div>
        )}

        {/* Current Plan */}
        <div
          style={{
            background: '#FFFFFF', border: '1px solid #E8E3DC',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            padding: '28px',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: '#6B5B4E',
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              marginBottom: '20px',
            }}
          >
            Current Plan
          </h2>

          <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                  fontSize: '24px',
                  fontWeight: 700,
                  marginBottom: '4px',
                }}
              >
                {subscriptionStatus === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 300,
                  color: '#78716C',
                }}
              >
                {subscriptionStatus === 'pro'
                  ? '$19/month — Unlimited checklist items'
                  : 'Up to 10 checklist items'
                }
              </div>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                color: subscriptionStatus === 'pro' ? '#D97706' : '#6B5B4E',
                background: subscriptionStatus === 'pro' ? 'rgba(217,119,6,0.12)' : 'rgba(255,255,255,0.04)',
                padding: '6px 14px',
                borderRadius: '4px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase' as const,
              }}
            >
              {subscriptionStatus === 'pro' ? 'Active' : 'Free'}
            </span>
          </div>

          {subscriptionStatus === 'pro' && nextBillingDate && (
            <div
              style={{
                background: '#FFFFFF', border: '1px solid #E8E3DC',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '4px',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '12px', fontWeight: 400, color: '#6B5B4E', marginBottom: '4px' }}>
                Next billing date
              </div>
              <div style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '16px', fontWeight: 500, color: '#1C1917' }}>
                {nextBillingDate}
              </div>
            </div>
          )}

          {subscriptionStatus === 'free' && (
            <button
              onClick={handleUpgrade}
              className="hover:opacity-90 transition-opacity"
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
              }}
            >
              Upgrade to Pro — $19/month
            </button>
          )}

          {subscriptionStatus === 'pro' && (
            <button
              onClick={handleCancelSubscription}
              className="hover:opacity-80 transition-opacity"
              style={{
                width: '100%',
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: '#78716C',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                padding: '12px 24px',
                cursor: 'pointer',
              }}
            >
              Cancel Subscription
            </button>
          )}
        </div>

        {/* Feature Comparison */}
        <div
          style={{
            background: '#FFFFFF', border: '1px solid #E8E3DC',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            padding: '28px',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: '#6B5B4E',
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              marginBottom: '24px',
            }}
          >
            Plan Features
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div
              style={{
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '24px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                  fontSize: '18px',
                  fontWeight: 500,
                  marginBottom: '20px',
                }}
              >
                Free Plan
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Up to 10 checklist items', 'Opening & closing checklists', 'Staff completion tracking', 'Manager dashboard'].map((f, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                      fontSize: '14px',
                      fontWeight: 300,
                      color: '#78716C',
                      marginBottom: '12px',
                    }}
                  >
                    <span style={{ color: '#6B5B4E', marginTop: '2px', flexShrink: 0 }}>&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div
              style={{
                background: 'rgba(217,119,6,0.06)',
                border: '1px solid rgba(217,119,6,0.2)',
                borderRadius: '8px',
                padding: '24px',
                position: 'relative' as const,
              }}
            >
              <div
                style={{
                  position: 'absolute' as const,
                  top: '-10px',
                  right: '24px',
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '10px',
                  fontWeight: 500,
                  color: '#1C1917',
                  background: '#D97706',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase' as const,
                }}
              >
                Best Value
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                  fontSize: '18px',
                  fontWeight: 500,
                  marginBottom: '20px',
                }}
              >
                Pro Plan
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  { text: 'Unlimited checklist items', bold: true },
                  { text: 'All Free features', bold: false },
                  { text: 'Priority email support', bold: false },
                  { text: '14-day free trial', bold: false },
                ].map((f, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                      fontSize: '14px',
                      fontWeight: f.bold ? 500 : 300,
                      color: f.bold ? '#F5F0E8' : '#A89880',
                      marginBottom: '12px',
                    }}
                  >
                    <span style={{ color: '#D97706', marginTop: '2px', flexShrink: 0 }}>&#10003;</span>
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Support */}
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 300,
              color: '#6B5B4E',
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
