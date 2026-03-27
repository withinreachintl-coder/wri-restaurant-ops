'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WelcomePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [restaurantName, setRestaurantName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')

  const handleComplete = () => {
    // TODO: Save to database
    router.push('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Welcome to Daily Ops! 🎉</h1>
          <p className="text-gray-600">Let's get you set up in under 2 minutes</p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full ${
                s <= step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Restaurant Info */}
        {step === 1 && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">About your restaurant</h2>
              <p className="text-gray-600 text-sm">We'll use this for your shift reports</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="e.g., Joe's Diner"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g., Joe Smith"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email for Reports
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., joe@joesdiner.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!restaurantName || !ownerName || !email}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Choose Checklists */}
        {step === 2 && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Which checklists do you need?</h2>
              <p className="text-gray-600 text-sm">You can customize these later</p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start p-4 border-2 border-blue-600 rounded-lg cursor-pointer bg-blue-50">
                <input type="checkbox" checked readOnly className="mt-1 mr-3" />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Opening Checklist</div>
                  <div className="text-sm text-gray-600">
                    Temps, setup, safety checks (recommended)
                  </div>
                </div>
              </label>

              <label className="flex items-start p-4 border-2 border-blue-600 rounded-lg cursor-pointer bg-blue-50">
                <input type="checkbox" checked readOnly className="mt-1 mr-3" />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Closing Checklist</div>
                  <div className="text-sm text-gray-600">
                    Cleaning, restocking, cash drop (recommended)
                  </div>
                </div>
              </label>

              <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300">
                <input type="checkbox" className="mt-1 mr-3" />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Mid-Shift Check</div>
                  <div className="text-sm text-gray-600">
                    Optional lunch/dinner prep verification
                  </div>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Quick Tour */}
        {step === 3 && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">How it works</h2>
              <p className="text-gray-600 text-sm">3 simple steps, done daily</p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Staff completes tasks</div>
                  <div className="text-sm text-gray-600">
                    Check off items, take photos as proof
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <div className="font-semibold text-gray-900">You see progress live</div>
                  <div className="text-sm text-gray-600">
                    Dashboard shows what's done in real-time
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Get automated summary</div>
                  <div className="text-sm text-gray-600">
                    Email report after each shift — no asking required
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-900">
                <strong>💡 Pro tip:</strong> Share the checklist link with your team. They don't need to create accounts — just open and complete.
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
