'use client'

import { useState } from 'react'
import Link from 'next/link'

type ChecklistStatus = {
  type: 'opening' | 'closing'
  date: string
  completedBy: string
  completedAt: string
  progress: number
  totalTasks: number
  completedTasks: number
}

const MOCK_HISTORY: ChecklistStatus[] = [
  {
    type: 'closing',
    date: '2026-03-23',
    completedBy: 'Sarah M.',
    completedAt: '11:45 PM',
    progress: 100,
    totalTasks: 9,
    completedTasks: 9,
  },
  {
    type: 'opening',
    date: '2026-03-23',
    completedBy: 'Mike T.',
    completedAt: '9:15 AM',
    progress: 100,
    totalTasks: 9,
    completedTasks: 9,
  },
  {
    type: 'closing',
    date: '2026-03-22',
    completedBy: 'Sarah M.',
    completedAt: '11:30 PM',
    progress: 89,
    totalTasks: 9,
    completedTasks: 8,
  },
]

export default function DashboardPage() {
  const [currentProgress] = useState({
    type: 'opening' as 'opening' | 'closing',
    progress: 67,
    completedTasks: 6,
    totalTasks: 9,
    inProgressBy: 'Mike T.',
    startedAt: '9:05 AM',
  })

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
              <p className="text-gray-600 mt-1">Real-time checklist tracking</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/checklist"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                + Start Checklist
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Current Shift Status */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Status</h2>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-gray-900 capitalize">
                    {currentProgress.type} Checklist
                  </h3>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
                    In Progress
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  Started by {currentProgress.inProgressBy} at {currentProgress.startedAt}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {currentProgress.progress}%
                </div>
                <div className="text-sm text-gray-600">
                  {currentProgress.completedTasks} of {currentProgress.totalTasks}
                </div>
              </div>
            </div>

            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${currentProgress.progress}%` }}
              />
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                href="/checklist"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View Live Progress →
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">This Week</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-gray-600 text-sm font-medium mb-1">Completion Rate</div>
              <div className="text-3xl font-bold text-gray-900">96%</div>
              <div className="text-sm text-green-600 mt-1">↑ 4% from last week</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-gray-600 text-sm font-medium mb-1">Avg. Completion Time</div>
              <div className="text-3xl font-bold text-gray-900">12 min</div>
              <div className="text-sm text-green-600 mt-1">↓ 2 min faster</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-gray-600 text-sm font-medium mb-1">Photos Attached</div>
              <div className="text-3xl font-bold text-gray-900">98%</div>
              <div className="text-sm text-green-600 mt-1">↑ 12% from last week</div>
            </div>
          </div>
        </section>

        {/* Checklist History */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Checklists</h2>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {MOCK_HISTORY.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded capitalize">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.completedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full w-24">
                          <div
                            className={`h-full rounded-full ${
                              item.progress === 100 ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {item.completedTasks}/{item.totalTasks}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.completedAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-blue-600 hover:text-blue-700 font-medium">
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Tips */}
        <section>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex gap-4">
              <div className="text-3xl">💡</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Pro Tip</h3>
                <p className="text-gray-700 text-sm">
                  Share the checklist link with your team via text or print a QR code. 
                  They can complete it without creating an account — just open and go.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
