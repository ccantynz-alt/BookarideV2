import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  DollarSign,
  Mail,
  LogOut,
  Menu,
  X,
  Shield,
  PlusCircle,
} from 'lucide-react'
import api from '../../lib/api'
import AdminLogin from './AdminLogin'
import AdminRegister from './AdminRegister'
import AdminDashboard from './AdminDashboard'
import AdminBookings from './AdminBookings'
import AdminLivePricing from './AdminLivePricing'
import AdminEmail from './AdminEmail'
import AdminCreateBooking from './AdminCreateBooking'

const NAV_ITEMS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/bookings', label: 'Bookings', icon: BookOpen },
  { path: '/admin/create-booking', label: 'New Booking', icon: PlusCircle },
  { path: '/admin/live-pricing', label: 'Live Pricing', icon: DollarSign },
  { path: '/admin/email', label: 'Email', icon: Mail },
]

function AdminShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [admin, setAdmin] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/admin/me').then((r) => setAdmin(r.data)).catch(() => {
      localStorage.removeItem('admin_token')
      navigate('/admin/login')
    })
  }, [navigate])

  function logout() {
    localStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1a2e] text-white transform transition-transform lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#d4a843]" />
            <span className="font-bold text-lg">BookARide Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-[#d4a843]/20 text-[#d4a843]'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          {admin && (
            <div className="text-sm text-white/60 mb-2 truncate">
              Logged in as <span className="text-white font-medium">{admin.username}</span>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            {NAV_ITEMS.find((i) => i.path === location.pathname)?.label || 'Admin'}
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="create-booking" element={<AdminCreateBooking />} />
            <Route path="live-pricing" element={<AdminLivePricing />} />
            <Route path="email" element={<AdminEmail />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const token = localStorage.getItem('admin_token')

  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route path="register" element={<AdminRegister />} />
      <Route path="*" element={token ? <AdminShell /> : <Navigate to="/admin/login" replace />} />
    </Routes>
  )
}
