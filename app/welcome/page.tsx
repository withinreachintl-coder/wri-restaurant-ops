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

  const inputStyle = {
    width: '100%',
    fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
    fontSize: '14px',
    fontWeight: 400,
    color: '#F5F0E8',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '4px',
    padding: '12px 16px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
    fontSize: '13px',
    fontWeight: 500 as const,
    color: '#A89880',
    marginBottom: '8px',
  }

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-8"
      style={{ background: '#1C1917' }}
    >
      <div style={{ maxWidth: '560px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              fontSize: '32px',
              fontWeight: 700,
              color: '#F5F0E8',
              marginBottom: '8px',
            }}
          >
            Welcome to Daily Ops
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '14px',
              fontWeight: 300,
              color: '#A89880',
            }}
          >
            Let&apos;s get you set up in under 2 minutes
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                height: '3px',
                flex: 1,
                borderRadius: '2px',
                background: s <= step ? '#D97706' : 'rgba(255,255,255,0.08)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '32px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                fontSize: '20px',
                fontWeight: 500,
                color: '#F5F0E8',
                marginBottom: '4px',
              }}
            >
              About your restaurant
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 300,
                color: '#6B5B4E',
                marginBottom: '24px',
              }}
            >
              We&apos;ll use this for your shift reports
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Restaurant Name</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="e.g., Joe's Diner"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Your Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g., Joe Smith"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Email for Reports</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., joe@joesdiner.com"
                style={inputStyle}
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!restaurantName || !ownerName || !email}
              className="hover:opacity-90 transition-opacity"
              style={{
                width: '100%',
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#1C1917',
                background: (!restaurantName || !ownerName || !email) ? '#6B5B4E' : '#D97706',
                border: 'none',
                borderRadius: '4px',
                padding: '14px 24px',
                cursor: (!restaurantName || !ownerName || !email) ? 'not-allowed' : 'pointer',
              }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '32px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                fontSize: '20px',
                fontWeight: 500,
                color: '#F5F0E8',
                marginBottom: '4px',
              }}
            >
              Which checklists do you need?
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 300,
                color: '#6B5B4E',
                marginBottom: '24px',
              }}
            >
              You can customize these later
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '16px',
                  background: 'rgba(217,119,6,0.06)',
                  border: '1px solid rgba(217,119,6,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <input type="checkbox" checked readOnly style={{ marginTop: '3px', marginRight: '12px', accentColor: '#D97706' }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '14px', fontWeight: 500, color: '#F5F0E8' }}>
                    Opening Checklist
                  </div>
                  <div style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '13px', fontWeight: 300, color: '#A89880' }}>
                    Temps, setup, safety checks (recommended)
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '16px',
                  background: 'rgba(217,119,6,0.06)',
                  border: '1px solid rgba(217,119,6,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <input type="checkbox" checked readOnly style={{ marginTop: '3px', marginRight: '12px', accentColor: '#D97706' }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '14px', fontWeight: 500, color: '#F5F0E8' }}>
                    Closing Checklist
                  </div>
                  <div style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '13px', fontWeight: 300, color: '#A89880' }}>
                    Cleaning, restocking, cash drop (recommended)
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <input type="checkbox" style={{ marginTop: '3px', marginRight: '12px', accentColor: '#D97706' }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '14px', fontWeight: 500, color: '#F5F0E8' }}>
                    Mid-Shift Check
                  </div>
                  <div style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '13px', fontWeight: 300, color: '#6B5B4E' }}>
                    Optional lunch/dinner prep verification
                  </div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep(1)}
                className="hover:opacity-80 transition-opacity"
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#F5F0E8',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '4px',
                  padding: '14px 24px',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="hover:opacity-90 transition-opacity"
                style={{
                  flex: 1,
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
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '32px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                fontSize: '20px',
                fontWeight: 500,
                color: '#F5F0E8',
                marginBottom: '4px',
              }}
            >
              How it works
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 300,
                color: '#6B5B4E',
                marginBottom: '28px',
              }}
            >
              3 simple steps, done daily
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
              {[
                { num: '1', title: 'Staff completes tasks', desc: 'Check off items, take photos as proof' },
                { num: '2', title: 'You see progress live', desc: 'Dashboard shows what\'s done in real-time' },
                { num: '3', title: 'Get automated summary', desc: 'Email report after each shift — no asking required' },
              ].map((item) => (
                <div key={item.num} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      background: 'rgba(217,119,6,0.15)',
                      border: '1px solid rgba(217,119,6,0.3)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#D97706',
                      flexShrink: 0,
                    }}
                  >
                    {item.num}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#F5F0E8',
                        marginBottom: '2px',
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                        fontSize: '13px',
                        fontWeight: 300,
                        color: '#A89880',
                      }}
                    >
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: 'rgba(217,119,6,0.06)',
                border: '1px solid rgba(217,119,6,0.15)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '13px',
                  fontWeight: 400,
                  color: '#A89880',
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: '#D97706', fontWeight: 500 }}>Pro tip:</strong> Share the checklist link with your team. They don&apos;t need to create accounts — just open and complete.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep(2)}
                className="hover:opacity-80 transition-opacity"
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#F5F0E8',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '4px',
                  padding: '14px 24px',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="hover:opacity-90 transition-opacity"
                style={{
                  flex: 1,
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
                Go to Dashboard &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
