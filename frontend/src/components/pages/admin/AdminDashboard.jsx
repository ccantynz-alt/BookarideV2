import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Loader2, RefreshCw, LogOut, CheckCircle, Clock, Car,
  XCircle, ChevronDown, Search, Phone, Mail, MapPin, Calendar,
  Users, DollarSign, X,
} from 'lucide-react'
import { cn } from '../../../lib/cn'
import api from '../../../lib/api'

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-800',   dot: 'bg-amber-400' },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800',   dot: 'bg-green-500' },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800',     dot: 'bg-blue-500'  },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800',       dot: 'bg-red-500'   },
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [counts, setCounts] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [updating, setUpdating] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter ? `?status=${filter}` : ''
      const [bookRes, countRes] = await Promise.all([
        api.get(`/bookings${params}`),
        api.get('/bookings/count'),
      ])
      setBookings(bookRes.data.bookings || [])
      setCounts(countRes.data)
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }, [filter, navigate])

  useEffect(() => { load() }, [load])

  function logout() {
    localStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  async function updateStatus(bookingId, status) {
    setUpdating(bookingId)
    try {
      await api.patch(`/bookings/${bookingId}`, { status })
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b))
      if (selected?.id === bookingId) setSelected(prev => ({ ...prev, status }))
      await load()
    } finally {
      setUpdating(null)
    }
  }

  const filtered = bookings.filter(b => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      b.name?.toLowerCase().includes(s) ||
      b.email?.toLowerCase().includes(s) ||
      b.phone?.includes(s) ||
      b.referenceNumber?.includes(s) ||
      b.pickupAddress?.toLowerCase().includes(s) ||
      b.dropoffAddress?.toLowerCase().includes(s)
    )
  })

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Topbar */}
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="text-gold font-bold text-lg">BookARide</span>
          <span className="text-gray-600 text-sm">/ Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} title="Refresh" className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: counts.total, icon: Car, color: 'text-gray-300' },
            { label: 'Pending',        value: counts.pending, icon: Clock, color: 'text-amber-400' },
            { label: 'Confirmed',      value: counts.confirmed, icon: CheckCircle, color: 'text-green-400' },
            { label: 'Completed',      value: counts.completed, icon: CheckCircle, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-xs uppercase tracking-wide">{s.label}</p>
                <s.icon className={cn("w-4 h-4", s.color)} />
              </div>
              <p className="text-3xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, phone, ref…"
              className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-600 focus:ring-2 focus:ring-gold/30 focus:border-gold/50"
            />
          </div>
          <div className="flex gap-2">
            {['', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
              <button key={s || 'all'} onClick={() => setFilter(s)}
                className={cn(
                  'px-3 py-2 text-xs font-medium rounded-lg border transition-all',
                  filter === s
                    ? 'bg-gold text-black border-gold'
                    : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-600'
                )}>
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-600">No bookings found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Ref</th>
                    <th className="text-left px-5 py-3">Customer</th>
                    <th className="text-left px-5 py-3 hidden md:table-cell">Route</th>
                    <th className="text-left px-5 py-3 hidden sm:table-cell">Date</th>
                    <th className="text-right px-5 py-3 hidden lg:table-cell">Total</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filtered.map(b => {
                    const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending
                    return (
                      <tr key={b.id} className="hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => setSelected(b)}>
                        <td className="px-5 py-4 font-mono text-gold text-xs">#{b.referenceNumber || b.id?.slice(-6)}</td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-white">{b.name}</div>
                          <div className="text-gray-500 text-xs">{b.phone}</div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell max-w-xs">
                          <div className="text-gray-300 truncate text-xs">{b.pickupAddress}</div>
                          <div className="text-gray-500 truncate text-xs">→ {b.dropoffAddress}</div>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell text-gray-300 text-xs">{b.date}<br /><span className="text-gray-500">{b.time}</span></td>
                        <td className="px-5 py-4 hidden lg:table-cell text-right text-gold font-semibold">
                          ${Number(b.totalPrice || b.pricing?.totalPrice || 0).toFixed(2)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', sc.color)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', sc.dot)} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                          <StatusDropdown booking={b} onUpdate={updateStatus} updating={updating} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <BookingDetail booking={selected} onClose={() => setSelected(null)} onUpdate={updateStatus} updating={updating} />
      )}
    </div>
  )
}

function StatusDropdown({ booking, onUpdate, updating }) {
  const [open, setOpen] = useState(false)
  const isUpdating = updating === booking.id
  return (
    <div className="relative">
      <button onClick={() => setOpen(p => !p)} className="p-1.5 text-gray-500 hover:text-white rounded hover:bg-gray-700 transition-colors">
        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-10 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden min-w-[140px]">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
            <button key={status} onClick={() => { onUpdate(booking.id, status); setOpen(false) }}
              className={cn('w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors', booking.status === status && 'opacity-40 pointer-events-none')}>
              <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />{cfg.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function BookingDetail({ booking: b, onClose, onUpdate, updating }) {
  const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-gray-900 border-l border-gray-800 overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-white">Booking #{b.referenceNumber || b.id?.slice(-6)}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium', sc.color)}>
              <span className={cn('w-2 h-2 rounded-full', sc.dot)} />{sc.label}
            </span>
            <span className="text-gold font-bold text-lg">
              ${Number(b.totalPrice || b.pricing?.totalPrice || 0).toFixed(2)} NZD
            </span>
          </div>

          {/* Customer */}
          <div className="bg-gray-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer</h3>
            <DetailRow icon={Users} value={b.name} />
            <DetailRow icon={Phone} value={b.phone} href={`tel:${b.phone}`} />
            <DetailRow icon={Mail} value={b.email} href={`mailto:${b.email}`} />
          </div>

          {/* Trip */}
          <div className="bg-gray-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-1">Trip</h3>
            <DetailRow icon={MapPin} label="Pickup" value={b.pickupAddress} />
            <DetailRow icon={MapPin} label="Drop-off" value={b.dropoffAddress} />
            <DetailRow icon={Calendar} label="Date" value={`${b.date} at ${b.time}`} />
            <DetailRow icon={Users} label="Passengers" value={b.passengers} />
            {b.departureFlightNumber && <DetailRow label="Dep. Flight" value={b.departureFlightNumber} />}
            {b.arrivalFlightNumber && <DetailRow label="Arr. Flight" value={b.arrivalFlightNumber} />}
            {b.bookReturn && b.returnDate && <DetailRow label="Return" value={`${b.returnDate} at ${b.returnTime}`} />}
            {b.notes && <DetailRow label="Notes" value={b.notes} />}
          </div>

          {/* Status update */}
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Update Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
                <button key={status}
                  onClick={() => onUpdate(b.id, status)}
                  disabled={b.status === status || updating === b.id}
                  className={cn(
                    'px-3 py-2 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5',
                    b.status === status
                      ? 'opacity-30 cursor-default border-gray-700 text-gray-500'
                      : 'border-gray-700 text-gray-300 hover:border-gold/50 hover:text-gold',
                  )}>
                  <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ icon: Icon, label, value, href }) {
  if (!value) return null
  const content = href
    ? <a href={href} className="text-gold hover:underline text-sm break-all">{value}</a>
    : <span className="text-white text-sm break-words">{value}</span>
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />}
      <div>
        {label && <p className="text-xs text-gray-500 mb-0.5">{label}</p>}
        {content}
      </div>
    </div>
  )
}
