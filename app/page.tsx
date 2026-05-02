"use client";

export default function LandingPage() {
  return (
    <main style={{ background: '#1C1917', color: '#F5F0E8', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(28,25,23,0.95)', backdropFilter: 'blur(10px)',
        height: '64px', display: 'flex', alignItems: 'center',
        padding: '0 24px', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', background: '#D97706',
            borderRadius: '6px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '16px', color: '#fff'
          }}>✓</div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700 }}>Daily Ops</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="#features" style={{ color: '#F5F0E8', textDecoration: 'none', fontSize: '15px' }}>How It Works</a>
          <span style={{ color: '#A8A29E', fontSize: '15px', fontWeight: 700 }}>Daily Ops</span>
          <a href="https://staff.wireach.tools" style={{ color: '#F5F0E8', textDecoration: 'none', fontSize: '15px' }}>Staff Comms</a>
          <a href="https://toolkit.wireach.tools" style={{ color: '#F5F0E8', textDecoration: 'none', fontSize: '15px' }}>Toolkit</a>
          <a href="#pricing" style={{ color: '#F5F0E8', textDecoration: 'none', fontSize: '15px' }}>Pricing</a>
          <a href="/auth/login" style={{ border: '1px solid #F5F0E8', padding: '8px 20px', borderRadius: '6px', color: '#F5F0E8', textDecoration: 'none', fontSize: '15px' }}>Sign In</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: '160px', paddingBottom: '80px', paddingLeft: '24px', paddingRight: '24px', maxWidth: '768px', margin: '0 auto' }}>
        <p style={{ color: '#D97706', fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '24px' }}>
          For Independent Restaurants
        </p>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '52px', lineHeight: 1.1, fontWeight: 700, marginBottom: '24px' }}>
          Your opening shift shouldn't start with{' '}
          <span style={{ color: '#D97706' }}>a missing checklist.</span>
        </h1>
        <p style={{ fontSize: '18px', color: '#A8A29E', lineHeight: 1.6, marginBottom: '40px', maxWidth: '560px' }}>
          Digital opening and closing checklists with timestamps, photo proof, and staff sign-off. Built for restaurant operators who are done with paper logs and guesswork.
        </p>

        <div style={{
          width: '100%',
          maxWidth: '720px',
          margin: '0 auto 40px',
          aspectRatio: '16 / 9',
          background: '#1C1917',
          border: '1px solid #3D3832',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <video
            src="/videos/daily-ops.mp4"
            poster="/videos/daily-ops-poster.png"
            autoPlay
            loop
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <a href="https://buy.stripe.com/28E5kC8lr0gJaYLcqZ9k403" target="_blank" style={{
            background: '#D97706', color: '#fff', padding: '14px 28px',
            borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '16px'
          }}>Start 14-Day Free Trial</a>
          <span style={{ color: '#78716C', fontSize: '14px' }}>No credit card required · $19/mo after trial</span>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 24px', maxWidth: '768px', margin: '0 auto' }}>
        <p style={{ color: '#D97706', fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
          What You Get
        </p>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, marginBottom: '48px' }}>
          Everything a shift needs. Nothing it doesn't.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
          {[
            { icon: '✓', title: 'Opening & Closing Checklists', desc: 'Digital checklists with timestamps and staff sign-off. Every task tracked, every shift accounted for.' },
            { icon: '📸', title: 'Photo Proof Built In', desc: 'Snap fridge temps, line checks, cleanliness. When the health inspector walks in, you\'re ready.' },
            { icon: '👤', title: 'Staff Accountability', desc: 'See who completed what and when. Auto-timestamped records that hold your team to the standard.' },
          ].map((f) => (
            <div key={f.title} style={{ background: '#292524', borderRadius: '12px', padding: '28px' }}>
              <div style={{
                width: '40px', height: '40px', background: '#1C1917', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', color: '#D97706', marginBottom: '20px'
              }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>{f.title}</h3>
              <p style={{ color: '#A8A29E', fontSize: '14px', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '80px 24px', maxWidth: '768px', margin: '0 auto' }}>
        <p style={{ color: '#D97706', fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
          Pricing
        </p>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, marginBottom: '48px' }}>
          Simple, honest pricing.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Free */}
          <div style={{ background: '#292524', borderRadius: '12px', padding: '32px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A8A29E', marginBottom: '16px' }}>Free</p>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', fontWeight: 700, marginBottom: '24px' }}>
              $0<span style={{ fontSize: '16px', color: '#A8A29E', fontFamily: 'DM Sans, sans-serif' }}>/month</span>
            </p>
            {['Up to 5 locations', 'Basic opening/closing checklists', 'Timestamp records'].map(item => (
              <p key={item} style={{ color: '#A8A29E', fontSize: '14px', marginBottom: '12px' }}>✓ {item}</p>
            ))}
            <a href="https://buy.stripe.com/28E5kC8lr0gJaYLcqZ9k403" target="_blank" style={{
              display: 'block', textAlign: 'center', marginTop: '32px',
              border: '1px solid #57534E', padding: '12px', borderRadius: '8px',
              color: '#F5F0E8', textDecoration: 'none', fontSize: '15px'
            }}>Get Started</a>
          </div>
          {/* Pro */}
          <div style={{ background: '#292524', borderRadius: '12px', padding: '32px', border: '1px solid #D97706' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D97706', marginBottom: '16px' }}>Pro</p>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', fontWeight: 700, marginBottom: '24px' }}>
              $19<span style={{ fontSize: '16px', color: '#A8A29E', fontFamily: 'DM Sans, sans-serif' }}>/month</span>
            </p>
            {['Unlimited locations', 'Unlimited checklists', 'Photo uploads', 'Email summaries', 'Priority support'].map(item => (
              <p key={item} style={{ color: '#A8A29E', fontSize: '14px', marginBottom: '12px' }}>✓ {item}</p>
            ))}
            <a href="https://buy.stripe.com/28E5kC8lr0gJaYLcqZ9k403" target="_blank" style={{
              display: 'block', textAlign: 'center', marginTop: '32px',
              background: '#D97706', padding: '12px', borderRadius: '8px',
              color: '#fff', textDecoration: 'none', fontSize: '15px', fontWeight: 600
            }}>Start 14-Day Free Trial</a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center', maxWidth: '768px', margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, marginBottom: '16px' }}>
          Ready to run a tighter shift?
        </h2>
        <p style={{ color: '#A8A29E', fontSize: '16px', marginBottom: '32px' }}>
          Start your free trial. No credit card. Cancel anytime.
        </p>
        <a href="https://buy.stripe.com/28E5kC8lr0gJaYLcqZ9k403" target="_blank" style={{
          background: '#D97706', color: '#fff', padding: '16px 36px',
          borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '16px'
        }}>Start 14-Day Free Trial</a>
      </section>

    </main>
  )
}
