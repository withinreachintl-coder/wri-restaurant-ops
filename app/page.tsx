export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl w-full space-y-8 text-center">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            Daily Ops Checklist
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Browser-based app for independent restaurant managers to run opening and closing checklists with digital sign-off
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-semibold mb-2">Digital Checklists</h3>
            <p className="text-gray-600 text-sm">
              Opening and closing tasks with photo sign-off. No more &quot;I didn&apos;t know&quot; excuses.
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-semibold mb-2">Manager Dashboard</h3>
            <p className="text-gray-600 text-sm">
              Real-time tracking of task completion. See what&apos;s done and what&apos;s pending.
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-4xl mb-3">📧</div>
            <h3 className="text-lg font-semibold mb-2">Automated Summaries</h3>
            <p className="text-gray-600 text-sm">
              Get a shift summary emailed to you after closing. Know what happened without asking.
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-4xl mb-3">📱</div>
            <h3 className="text-lg font-semibold mb-2">Mobile-First</h3>
            <p className="text-gray-600 text-sm">
              Works on any device. No app download required. Just open and go.
            </p>
          </div>
        </div>

        {/* Pricing CTA */}
        <div className="mt-12 p-8 bg-blue-50 rounded-xl border border-blue-200">
          <div className="space-y-4">
            <div className="text-3xl font-bold text-gray-900">$19/month</div>
            <p className="text-gray-600">14-day free trial • No credit card required • Cancel anytime</p>
            <a 
              href="https://buy.stripe.com/28E5kC8lr0gJaYLcqZ9k403"
              className="inline-block mt-4 px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Free Trial
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-sm text-gray-500">
          <p>Built for independent restaurant owners who need simple, reliable ops management.</p>
          <p className="mt-2">Questions? Email <a href="mailto:ops@wireach.tools" className="text-blue-600 hover:underline">ops@wireach.tools</a></p>
        </div>
      </div>
    </main>
  )
}
