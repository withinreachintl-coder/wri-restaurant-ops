import Link from 'next/link'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">How to Use Daily Ops Checklist</h1>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Free Plan Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-green-600">✓</span> Free Plan
          </h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">What You Can Do:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>Run opening and closing checklists</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>Mark items complete during a shift</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>Add up to 10 custom checklist items per list</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>Capture photos for items that require them</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>Enter staff name when starting a checklist session</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Free Plan Limits:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>Maximum 10 items per list (upgrade to unlock unlimited)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>Account owner only can manage billing and checklist items</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Paid Plan Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-blue-600">★</span> Paid Plan ($19/month)
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span className="font-semibold">Unlimited checklist items</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>All free features included</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>14-day free trial (no credit card required)</span>
              </li>
            </ul>
            <Link 
              href="/billing" 
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Upgrade to Pro →
            </Link>
          </div>
        </div>

        {/* General Tips Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">💡 General Tips</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-gray-600 font-bold mt-0.5">→</span>
                <span>Use <strong>Opening checklist</strong> at the start of every shift</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-600 font-bold mt-0.5">→</span>
                <span>Use <strong>Closing checklist</strong> before locking up</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-600 font-bold mt-0.5">→</span>
                <span>Photos marked "required" must be uploaded before the item counts as complete</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-600 font-bold mt-0.5">→</span>
                <span>Only the account owner can edit the checklist items</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Support Section */}
        <div className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-600">
            Need help? Email us at{' '}
            <a href="mailto:support@wireach.tools" className="text-blue-600 hover:text-blue-700">
              support@wireach.tools
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
