import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, CheckCircle, XCircle, Activity, Loader2 } from 'lucide-react'
import api from '../../lib/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard').then((r) => setStats(r.data)),
      api.get('/admin/system-health').then((r) => setHealth(r.data)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const cards = [
    { label: 'Total Bookings', value: stats?.total_bookings || 0, icon: BookOpen, color: 'bg-blue-500' },
    { label: "Today's Bookings", value: stats?.todays_bookings || 0, icon: Clock, color: 'bg-purple-500' },
    { label: 'Pending', value: stats?.pending || 0, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Confirmed', value: stats?.confirmed || 0, icon: CheckCircle, color: 'bg-green-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{card.label}</span>
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
          </div>
        ))}
      </div>

      {/* System health */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-400" />
          System Health
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${health?.database === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">Database: <strong>{health?.database || 'unknown'}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${health?.api === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">API: <strong>{health?.api || 'unknown'}</strong></span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/bookings"
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            View All Bookings
          </Link>
          <Link
            to="/admin/live-pricing"
            className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
          >
            Get a Quick Price
          </Link>
          <Link
            to="/admin/email"
            className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
          >
            Test Email Setup
          </Link>
        </div>
      </div>
    </div>
  )
}
