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
    // Check for success/canceled query params
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
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('No authenticated user:', authError)
        setLoading(false)
        return
      }

      // Get user's org_id
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

      // Get organization subscription status
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

      // Determine if user is on Pro plan
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
      // Create Stripe Checkout Session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading billing information...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <Link 
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="font-semibold">Success! Your subscription is now active.</span>
            </div>
          </div>
        )}

        {/* Canceled Message */}
        {showCanceled && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <span className="font-semibold">Checkout was canceled. No charges were made.</span>
            </div>
          </div>
        )}

        {/* Current Plan Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {subscriptionStatus === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </div>
              <div className="text-gray-600 mt-1">
                {subscriptionStatus === 'pro' 
                  ? '$19/month - Unlimited checklist items'
                  : 'Up to 10 checklist items'
                }
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full font-semibold ${
              subscriptionStatus === 'pro'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {subscriptionStatus === 'pro' ? 'Active' : 'Free'}
            </div>
          </div>

          {subscriptionStatus === 'pro' && nextBillingDate && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600">Next billing date</div>
              <div className="text-lg font-semibold text-gray-900">{nextBillingDate}</div>
            </div>
          )}

          {subscriptionStatus === 'free' && (
            <button
              onClick={handleUpgrade}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Upgrade to Pro - $19/month
            </button>
          )}

          {subscriptionStatus === 'pro' && (
            <button
              onClick={handleCancelSubscription}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel Subscription
            </button>
          )}
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Plan Features</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Free Plan</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">Up to 10 checklist items</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">Opening & closing checklists</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">Staff completion tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">Manager dashboard</span>
                </li>
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-gray-900">Pro Plan</h3>
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">BEST VALUE</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-900 font-medium">Unlimited checklist items</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">All Free features</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">Priority email support</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">14-day free trial</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Questions about billing? Contact us at{' '}
          <a href="mailto:support@wireach.tools" className="text-blue-600 hover:text-blue-700 font-medium">
            support@wireach.tools
          </a>
        </div>
      </div>
    </main>
  )
}
