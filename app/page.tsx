import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ background: '#1C1917', color: '#F5F0E8' }}>
      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(28,25,23,0.95)', backdropFilter: 'blur(10px)', height: '64px', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', background: '#D97706',
            borderRadius: '6px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '16px', color: '#fff'
          }}>✓</div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700 }}>Daily Ops</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link
            href="/help"
            className="hidden sm:inline hover:opacity-80 transition-opacity"
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '14px',
              fontWeight: 400,
              color: '#A89880',
              textDecoration: 'none',
            }}
          >
            How It Works
          </Link>
          <Link
            href="/auth/login"
            className="hover:opacity-80 transition-opacity"
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#F5F0E8',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              padding: '8px 20px',
              textDecoration: 'none',
            }}
          >
            Log In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: '768px', margin: '0 auto', padding: '0 24px', paddingTop: '160px', paddingBottom: '80px' }}>
        <div className="max-w-3xl">
          <p
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: '#D97706',
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              marginBottom: '20px',
            }}
          >
            For independent restaurants
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: '24px',
            }}
          >
            Your opening shift<br />
            shouldn&apos;t start with<br />
            <span style={{ color: '#D97706' }}>a missing checklist.</span>
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '18px',
              fontWeight: 300,
              lineHeight: 1.7,
              color: '#A89880',
              maxWidth: '520px',
              marginBottom: '40px',
            }}
          >
            Digital opening and closing checklists with timestamps, photo proof,
            and staff sign-off. Built for restaurant operators who are done with
            paper logs and guesswork.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://buy.stripe.com/28E5kC8lr0gJaYLcqZ9k403"
              className="hover:opacity-90 transition-opacity"
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                background: '#D97706',
                color: '#1C1917',
                fontSize: '15px',
                fontWeight: 500,
                padding: '14px 32px',
                borderRadius: '4px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Start 14-Day Free Trial
            </a>
            <span
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 400,
                color: '#6B5B4E',
              }}
            >
              No credit card required &middot; $19/mo after trial
            </span>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
      </div>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20 md:py-24">
        <p
          style={{
            fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
            fontSize: '13px',
            fontWeight: 500,
            color: '#6B5B4E',
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            marginBottom: '12px',
          }}
        >
          What you get
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-playfair), "Playfair Display", serif',
            fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
            fontWeight: 500,
            marginBottom: '48px',
          }}
        >
          Everything a shift needs. Nothing it doesn&apos;t.
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              ),
              label: 'Opening & Closing Checklists',
              body: 'Digital checklists with timestamps and staff sign-off. Every task tracked, every shift accounted for.',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                </svg>
              ),
              label: 'Photo Proof Built In',
              body: 'Snap fridge temps, line checks, cleanliness. When the health inspector walks in, you\'re ready.',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              ),
              label: 'Staff Accountability',
              body: 'See who completed what and when. Auto-timestamped records that hold your team to the standard.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '32px 28px',
                transition: 'border-color 0.25s ease',
              }}
              className="hover:!border-[rgba(217,119,6,0.15)]"
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'rgba(217,119,6,0.1)',
                  border: '1px solid rgba(217,119,6,0.2)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                {feature.icon}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                  fontSize: '18px',
                  fontWeight: 500,
                  marginBottom: '12px',
                }}
              >
                {feature.label}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 300,
                  lineHeight: 1.7,
                  color: '#A89880',
                }}
              >
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
      </div>

      {/* Quote */}
      <section className="max-w-5xl mx-auto px-6 py-20 md:py-24">
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            padding: '40px 36px',
            position: 'relative' as const,
            overflow: 'hidden',
          }}
        >
          {/* Decorative quotation mark */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-8px',
              left: '24px',
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              fontSize: '120px',
              fontWeight: 700,
              lineHeight: 1,
              color: 'rgba(217,119,6,0.08)',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            &ldquo;
          </div>
          <p
            style={{
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
              fontWeight: 400,
              fontStyle: 'italic',
              lineHeight: 1.6,
              marginBottom: '16px',
              position: 'relative',
            }}
          >
            &ldquo;I built this for my own restaurant because paper checklists
            were killing us. Missed tasks, no proof, no accountability.
            Now every shift runs the same way.&rdquo;
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <div
              style={{
                width: '24px',
                height: '1px',
                background: 'rgba(217,119,6,0.3)',
              }}
            />
            <p
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 400,
                color: '#6B5B4E',
              }}
            >
              Independent restaurant owner, tired of health inspector stress
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
      </div>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 py-20 md:py-24">
        <p
          style={{
            fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
            fontSize: '13px',
            fontWeight: 500,
            color: '#6B5B4E',
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            marginBottom: '12px',
          }}
        >
          Pricing
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-playfair), "Playfair Display", serif',
            fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
            fontWeight: 500,
            marginBottom: '48px',
          }}
        >
          Simple. Honest. No surprises.
        </h2>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
          {/* Free Tier */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              padding: '36px 32px',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '12px',
                fontWeight: 500,
                color: '#6B5B4E',
                letterSpacing: '0.06em',
                textTransform: 'uppercase' as const,
                marginBottom: '8px',
              }}
            >
              Free
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                  fontSize: '40px',
                  fontWeight: 700,
                }}
              >
                $0
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 300,
                  color: '#6B5B4E',
                }}
              >
                /month
              </span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0' }}>
              {['Up to 10 checklist items', 'Photo capture', 'Team sign-off'].map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                    fontSize: '14px',
                    fontWeight: 300,
                    color: '#A89880',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ color: '#6B5B4E', marginTop: '2px', flexShrink: 0 }}>&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/login"
              className="hover:opacity-80 transition-opacity"
              style={{
                display: 'block',
                textAlign: 'center',
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#F5F0E8',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '4px',
                padding: '12px 24px',
                textDecoration: 'none',
              }}
            >
              Get Started
            </Link>
          </div>

          {/* Pro Tier */}
          <div
            style={{
              background: 'rgba(217,119,6,0.06)',
              border: '1px solid rgba(217,119,6,0.2)',
              borderRadius: '8px',
              padding: '36px 32px',
              position: 'relative' as const,
            }}
          >
            <div
              style={{
                position: 'absolute' as const,
                top: '-12px',
                left: '32px',
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                color: '#1C1917',
                background: '#D97706',
                padding: '4px 12px',
                borderRadius: '4px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase' as const,
              }}
            >
              Recommended
            </div>
            <p
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '12px',
                fontWeight: 500,
                color: '#D97706',
                letterSpacing: '0.06em',
                textTransform: 'uppercase' as const,
                marginBottom: '8px',
              }}
            >
              Pro
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                  fontSize: '40px',
                  fontWeight: 700,
                }}
              >
                $19
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 300,
                  color: '#6B5B4E',
                }}
              >
                /month
              </span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0' }}>
              {['Unlimited checklist items', 'Everything in Free', 'Priority support'].map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                    fontSize: '14px',
                    fontWeight: 300,
                    color: '#A89880',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ color: '#D97706', marginTop: '2px', flexShrink: 0 }}>&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="https://buy.stripe.com/28E5kC8lr0gJaYLcqZ9k403"
              className="hover:opacity-90 transition-opacity"
              style={{
                display: 'block',
                textAlign: 'center',
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#1C1917',
                background: '#D97706',
                borderRadius: '4px',
                padding: '12px 24px',
                textDecoration: 'none',
              }}
            >
              Start 14-Day Free Trial
            </a>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
      </div>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-6 py-20 md:py-24 text-center">
        <h2
          style={{
            fontFamily: 'var(--font-playfair), "Playfair Display", serif',
            fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
            fontWeight: 500,
            marginBottom: '16px',
          }}
        >
          Ready to run a tighter shift?
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
            fontSize: '16px',
            fontWeight: 300,
            color: '#A89880',
            marginBottom: '32px',
          }}
        >
          Start your free trial. No credit card. Cancel anytime.
        </p>
        <a
          href="https://buy.stripe.com/28E5kC8lr0gJaYLcqZ9k403"
          className="hover:opacity-90 transition-opacity"
          style={{
            fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
            background: '#D97706',
            color: '#1C1917',
            fontSize: '15px',
            fontWeight: 500,
            padding: '14px 32px',
            borderRadius: '4px',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Start 14-Day Free Trial
        </a>
      </section>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 300,
              color: '#6B5B4E',
            }}
          >
            Built for independent restaurants, by an independent restaurant owner.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/help"
              className="hover:opacity-80 transition-opacity"
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 400,
                color: '#6B5B4E',
                textDecoration: 'none',
              }}
            >
              How to Use
            </Link>
            <a
              href="mailto:support@wireach.tools"
              className="hover:opacity-80 transition-opacity"
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 400,
                color: '#6B5B4E',
                textDecoration: 'none',
              }}
            >
              support@wireach.tools
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
