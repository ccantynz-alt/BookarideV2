import { useState, useEffect } from 'react'
import {
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Mail,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lock,
  DollarSign,
  PlusCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'

const STATUS_BADGES = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
  confirmed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
  completed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [message, setMessage] = useState(null)
  const [priceOverride, setPriceOverride] = useState({ id: null, value: '', reason: '' })

  async function fetchBookings() {
    setLoading(true)
    try {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const { data } = await api.get(`/bookings${params}`)
      setBookings(data.bookings || [])
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [statusFilter])

  function showMessage(text, type = 'success') {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  async function confirmBooking(id) {
    setActionLoading(id)
    try {
      await api.post(`/admin/bookings/${id}/confirm`)
      showMessage('Booking confirmed and confirmation email sent')
      fetchBookings()
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to confirm', 'error')
    } finally {
      setActionLoading(null)
      setConfirmDialog(null)
    }
  }

  async function cancelBooking(id) {
    setActionLoading(id)
    try {
      await api.post(`/admin/bookings/${id}/cancel`, { reason: 'Cancelled by admin' })
      showMessage('Booking cancelled')
      fetchBookings()
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to cancel', 'error')
    } finally {
      setActionLoading(null)
      setConfirmDialog(null)
    }
  }

  async function deleteBooking(id) {
    setActionLoading(id)
    try {
      await api.delete(`/bookings/${id}`)
      showMessage('Booking archived and removed')
      fetchBookings()
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to delete', 'error')
    } finally {
      setActionLoading(null)
      setConfirmDialog(null)
    }
  }

  async function resendConfirmation(id) {
    setActionLoading(id)
    try {
      const { data } = await api.post(`/admin/email/send-confirmation/${id}`)
      showMessage(data.message || 'Email sent')
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to send email', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  async function submitPriceOverride(id) {
    if (!priceOverride.value || parseFloat(priceOverride.value) <= 0) {
      showMessage('Please enter a valid price', 'error')
      return
    }
    setActionLoading(id)
    try {
      const { data } = await api.patch(`/admin/bookings/${id}/price-override`, {
        totalPrice: parseFloat(priceOverride.value),
        reason: priceOverride.reason,
      })
      showMessage(data.message || 'Price updated')
      setPriceOverride({ id: null, value: '', reason: '' })
      fetchBookings()
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to update price', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = bookings.filter((b) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (b.name || '').toLowerCase().includes(q) ||
      (b.email || '').toLowerCase().includes(q) ||
      (b.referenceNumber || '').includes(q) ||
      (b.pickupAddress || '').toLowerCase().includes(q) ||
      (b.dropoffAddress || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      {/* Message banner */}
      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Confirm dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                confirmDialog.type === 'delete' ? 'bg-red-100' : confirmDialog.type === 'cancel' ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                {confirmDialog.type === 'delete' ? (
                  <Trash2 className="w-5 h-5 text-red-600" />
                ) : confirmDialog.type === 'cancel' ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{confirmDialog.title}</h3>
                <p className="text-sm text-gray-500">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                disabled={actionLoading}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${
                  confirmDialog.type === 'delete' ? 'bg-red-600 hover:bg-red-700'
                  : confirmDialog.type === 'cancel' ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/admin/create-booking"
          className="px-4 py-2.5 bg-[#d4a843] text-white rounded-lg text-sm font-medium hover:bg-[#c49a3a] transition-colors flex items-center gap-1.5 shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> New Booking
        </Link>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookings by name, email, reference..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843]/40 focus:border-[#d4a843]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Lock notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 text-sm text-blue-700">
        <Lock className="w-4 h-4 shrink-0" />
        Bookings are protected. All destructive actions (cancel, delete) require confirmation.
      </div>

      {/* Bookings list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No bookings found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const badge = STATUS_BADGES[b.status] || STATUS_BADGES.pending
            const isExpanded = expanded === b.id
            const pricing = b.pricing || {}

            return (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Row header */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : b.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900">#{b.referenceNumber || '—'}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                        <badge.icon className="w-3 h-3" />
                        {(b.status || 'pending').charAt(0).toUpperCase() + (b.status || 'pending').slice(1)}
                      </span>
                      {b.payment_status === 'paid' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Paid</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 truncate">{b.name} &mdash; {b.pickupAddress} &rarr; {b.dropoffAddress}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{b.date} at {b.time} &middot; {b.email}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-gray-900">${(pricing.totalPrice || b.totalPrice || 0).toFixed(2)}</div>
                    <div className="text-xs text-gray-400">NZD</div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-gray-400">Service:</span>{' '}
                        <span className="text-gray-700">{b.serviceType}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Passengers:</span>{' '}
                        <span className="text-gray-700">{b.passengers}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Phone:</span>{' '}
                        <span className="text-gray-700">{b.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Payment:</span>{' '}
                        <span className="text-gray-700">{b.payment_status || 'unpaid'}</span>
                      </div>
                      {b.departureFlightNumber && (
                        <div>
                          <span className="text-gray-400">Departure Flight:</span>{' '}
                          <span className="text-gray-700">{b.departureFlightNumber}</span>
                        </div>
                      )}
                      {b.arrivalFlightNumber && (
                        <div>
                          <span className="text-gray-400">Arrival Flight:</span>{' '}
                          <span className="text-gray-700">{b.arrivalFlightNumber}</span>
                        </div>
                      )}
                      {b.bookReturn && (
                        <>
                          <div>
                            <span className="text-gray-400">Return Date:</span>{' '}
                            <span className="text-gray-700">{b.returnDate} at {b.returnTime}</span>
                          </div>
                          {b.returnFlightNumber && (
                            <div>
                              <span className="text-gray-400">Return Flight:</span>{' '}
                              <span className="text-gray-700">{b.returnFlightNumber}</span>
                            </div>
                          )}
                        </>
                      )}
                      {b.notes && (
                        <div className="sm:col-span-2">
                          <span className="text-gray-400">Notes:</span>{' '}
                          <span className="text-gray-700">{b.notes}</span>
                        </div>
                      )}

                      {/* Price breakdown */}
                      {pricing.basePrice && (
                        <div className="sm:col-span-2 bg-gray-50 rounded-lg p-3 space-y-1">
                          <div className="text-xs font-semibold text-gray-500 mb-2">PRICE BREAKDOWN</div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Base ({pricing.distance?.toFixed(1)} km)</span>
                            <span>${pricing.basePrice?.toFixed(2)}</span>
                          </div>
                          {pricing.airportFee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">VIP Airport</span>
                              <span>${pricing.airportFee?.toFixed(2)}</span>
                            </div>
                          )}
                          {pricing.oversizedLuggageFee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Oversized Luggage</span>
                              <span>${pricing.oversizedLuggageFee?.toFixed(2)}</span>
                            </div>
                          )}
                          {pricing.passengerFee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Extra Passengers</span>
                              <span>${pricing.passengerFee?.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm border-t border-gray-200 pt-1 mt-1">
                            <span className="text-gray-500">Stripe Fee</span>
                            <span>${pricing.stripeFee?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-sm border-t border-gray-200 pt-1 mt-1">
                            <span>Total</span>
                            <span className="text-[#d4a843]">${pricing.totalPrice?.toFixed(2)} NZD</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Price override indicator */}
                    {pricing.priceOverride && (
                      <div className="sm:col-span-2 mt-2 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Price manually overridden by {pricing.overrideBy || 'admin'}
                        {pricing.originalTotalPrice && <span> (was ${pricing.originalTotalPrice.toFixed(2)})</span>}
                      </div>
                    )}

                    {/* Price override form */}
                    {priceOverride.id === b.id ? (
                      <div className="sm:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2 space-y-2">
                        <div className="text-xs font-semibold text-amber-800">OVERRIDE PRICE</div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={priceOverride.value}
                              onChange={(e) => setPriceOverride({ ...priceOverride, value: e.target.value })}
                              placeholder="New price"
                              className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <input
                            type="text"
                            value={priceOverride.reason}
                            onChange={(e) => setPriceOverride({ ...priceOverride, reason: e.target.value })}
                            placeholder="Reason (optional)"
                            className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitPriceOverride(b.id)}
                            disabled={actionLoading === b.id}
                            className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 disabled:opacity-50"
                          >
                            {actionLoading === b.id ? 'Saving...' : 'Save Price'}
                          </button>
                          <button
                            onClick={() => setPriceOverride({ id: null, value: '', reason: '' })}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                      {b.status === 'pending' && (
                        <button
                          onClick={() => setConfirmDialog({
                            title: 'Confirm Booking',
                            message: `Confirm booking #${b.referenceNumber} for ${b.name}? A confirmation email will be sent.`,
                            type: 'confirm',
                            onConfirm: () => confirmBooking(b.id),
                          })}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" /> Confirm
                        </button>
                      )}
                      <button
                        onClick={() => resendConfirmation(b.id)}
                        disabled={actionLoading === b.id}
                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {actionLoading === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        Resend Email
                      </button>
                      <button
                        onClick={() => setPriceOverride({ id: b.id, value: (pricing.totalPrice || b.totalPrice || 0).toFixed(2), reason: '' })}
                        className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                      >
                        <DollarSign className="w-4 h-4" /> Override Price
                      </button>
                      {b.status !== 'cancelled' && (
                        <button
                          onClick={() => setConfirmDialog({
                            title: 'Cancel Booking',
                            message: `Are you sure you want to cancel booking #${b.referenceNumber}? This action can be undone by re-confirming.`,
                            type: 'cancel',
                            onConfirm: () => cancelBooking(b.id),
                          })}
                          className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-100 transition-colors flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" /> Cancel
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDialog({
                          title: 'Delete Booking',
                          message: `Permanently delete booking #${b.referenceNumber}? It will be archived but removed from the active bookings list. This cannot be undone.`,
                          type: 'delete',
                          onConfirm: () => deleteBooking(b.id),
                        })}
                        className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
