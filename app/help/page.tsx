import Link from 'next/link'

export default function HelpPage() {
  return (
    <main className="min-h-screen" style={{ background: '#1C1917', color: '#F5F0E8' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px' }}>
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: '36px' }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              fontSize: '24px',
              fontWeight: 700,
            }}
          >
            How to Use Daily Ops
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

        {/* Free Plan */}
        <section style={{ marginBottom: '36px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              fontSize: '18px',
              fontWeight: 500,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ color: '#D97706' }}>&#10003;</span> Free Plan
          </h2>

          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '12px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: '#A89880',
                letterSpacing: '0.04em',
                textTransform: 'uppercase' as const,
                marginBottom: '16px',
              }}
            >
              What you can do
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                'Run opening and closing checklists',
                'Mark items complete during a shift',
                'Add up to 10 custom checklist items per list',
                'Capture photos for items that require them',
                'Enter staff name when starting a checklist session',
              ].map((item, i) => (
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
                    marginBottom: '10px',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: '#D97706', marginTop: '2px', flexShrink: 0 }}>&#8226;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: '#6B5B4E',
                letterSpacing: '0.04em',
                textTransform: 'uppercase' as const,
                marginBottom: '16px',
              }}
            >
              Free plan limits
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                'Maximum 10 items per list (upgrade to unlock unlimited)',
                'Account owner only can manage billing and checklist items',
              ].map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                    fontSize: '14px',
                    fontWeight: 300,
                    color: '#6B5B4E',
                    marginBottom: '10px',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ marginTop: '2px', flexShrink: 0 }}>&#8226;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Pro Plan */}
        <section style={{ marginBottom: '36px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              fontSize: '18px',
              fontWeight: 500,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ color: '#D97706' }}>&#9733;</span> Pro Plan — $19/month
          </h2>
          <div
            style={{
              background: 'rgba(217,119,6,0.06)',
              border: '1px solid rgba(217,119,6,0.15)',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0' }}>
              {[
                { text: 'Unlimited checklist items', bold: true },
                { text: 'All free features included', bold: false },
                { text: '14-day free trial (no credit card required)', bold: false },
              ].map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                    fontSize: '14px',
                    fontWeight: item.bold ? 500 : 300,
                    color: item.bold ? '#F5F0E8' : '#A89880',
                    marginBottom: '10px',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: '#D97706', marginTop: '2px', flexShrink: 0 }}>&#8226;</span>
                  {item.text}
                </li>
              ))}
            </ul>
            <Link
              href="/billing"
              className="hover:opacity-90 transition-opacity"
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: '#1C1917',
                background: '#D97706',
                borderRadius: '4px',
                padding: '10px 20px',
                textDecoration: 'none',
              }}
            >
              Upgrade to Pro &rarr;
            </Link>
          </div>
        </section>

        {/* Tips */}
        <section style={{ marginBottom: '36px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              fontSize: '18px',
              fontWeight: 500,
              marginBottom: '16px',
            }}
          >
            General Tips
          </h2>
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { prefix: 'Opening checklist', suffix: ' at the start of every shift' },
                { prefix: 'Closing checklist', suffix: ' before locking up' },
                { prefix: 'Photos marked "required"', suffix: ' must be uploaded before the item counts as complete' },
                { prefix: 'Only the account owner', suffix: ' can edit the checklist items' },
              ].map((tip, i) => (
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
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: '#D97706', marginTop: '2px', flexShrink: 0 }}>&rarr;</span>
                  <span>
                    <strong style={{ color: '#F5F0E8', fontWeight: 500 }}>{tip.prefix}</strong>
                    {tip.suffix}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Support */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
          <p
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 300,
              color: '#6B5B4E',
            }}
          >
            Need help? Email us at{' '}
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
