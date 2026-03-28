import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        {/* Header with Login */}
        <div className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">✓</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Daily Ops</span>
          </div>
          <Link 
            href="/auth/login"
            className="text-blue-600 hover:text-blue-700 font-medium px-4 py-2"
          >
            Log In
          </Link>
        </div>

        {/* Hero Content */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Run your restaurant shift<br />
            <span className="text-blue-600">without the chaos</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Digital opening and closing checklists built for independent restaurant owners who are tired of paper logs and lost records
          </p>

          {/* CTA Button */}
          <a
            href="https://buy.stripe.com/7sYdR859f5B37Mz2Qp9k404"
            className="inline-block bg-blue-600 text-white text-lg font-semibold px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Start Free Trial
          </a>
          <p className="text-sm text-gray-500 mt-4">
            Start free — no credit card needed for 14 days
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Opening & Closing Checklists
            </h3>
            <p className="text-gray-600">
              Digital checklists with timestamps and staff sign-off. No more lost paper logs or forgotten tasks.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📸</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Photo Capture Built-In
            </h3>
            <p className="text-gray-600">
              Capture fridge temps, equipment checks, and cleanliness proof. Health inspectors love it.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Team Accountability
            </h3>
            <p className="text-gray-600">
              See who completed what and when. Auto-timestamped records you can trust.
            </p>
          </div>
        </div>

        {/* Social Proof / Trust Section */}
        <div className="bg-blue-50 rounded-2xl p-8 md:p-12 text-center">
          <p className="text-lg text-gray-700 mb-2">
            "I built this for my own restaurant because paper checklists were killing us."
          </p>
          <p className="text-sm text-gray-600">
            — Independent restaurant owner who got tired of health inspector stress
          </p>
        </div>

        {/* Pricing Preview */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Simple, honest pricing
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start free. Upgrade when you're ready.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-gray-200">
              <div className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Free
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-4">
                $0
                <span className="text-lg text-gray-500 font-normal">/month</span>
              </div>
              <ul className="text-left space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-600">Up to 10 checklist items</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-600">Photo capture</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-600">Team accountability</span>
                </li>
              </ul>
              <button className="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                Start Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-blue-600 p-8 rounded-xl shadow-lg text-white relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="text-sm font-semibold uppercase mb-2 opacity-90">
                Pro
              </div>
              <div className="text-4xl font-bold mb-4">
                $19
                <span className="text-lg font-normal opacity-90">/month</span>
              </div>
              <ul className="text-left space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Unlimited checklist items</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Everything in Free</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
              <a
                href="https://buy.stripe.com/7sYdR859f5B37Mz2Qp9k404"
                className="block w-full py-3 px-6 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center"
              >
                Start 14-Day Trial
              </a>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to ditch the paper?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start your free trial. No credit card required.
          </p>
          <a
            href="https://buy.stripe.com/7sYdR859f5B37Mz2Qp9k404"
            className="inline-block bg-blue-600 text-white text-lg font-semibold px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Start Free Trial
          </a>
        </div>

        {/* Footer */}
        <div className="mt-24 pt-12 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>
            Built for independent restaurants, by an independent restaurant owner.
          </p>
          <div className="mt-4 flex justify-center gap-6">
            <a href="mailto:support@wireach.tools" className="hover:text-blue-600">
              support@wireach.tools
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
