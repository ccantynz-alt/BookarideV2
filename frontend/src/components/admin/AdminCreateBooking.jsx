import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plane,
  MapPin,
  Users,
  Loader2,
  DollarSign,
  Star,
  Luggage,
  RotateCcw,
  Send,
  Plus,
  X,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
} from 'lucide-react'
import api from '../../lib/api'
import AddressInput from '../booking/AddressInput'

const SERVICE_TYPES = [
  { id: 'airport-transfer', label: 'Airport Transfer', icon: Plane },
  { id: 'point-to-point', label: 'Point to Point', icon: MapPin },
]

export default function AdminCreateBooking() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [pricingLoading, setPricingLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [calculatedPrice, setCalculatedPrice] = useState(null)
  const [paymentLinkSent, setPaymentLinkSent] = useState(false)
  const [paymentLinkLoading, setPaymentLinkLoading] = useState(false)

  const [form, setForm] = useState({
    serviceType: 'airport-transfer',
    pickupAddress: '',
    pickupAddresses: [],
    dropoffAddress: '',
    date: '',
    time: '',
    passengers: '1',
    name: '',
    email: '',
    phone: '',
    notes: '',
    departureFlightNumber: '',
    arrivalFlightNumber: '',
    bookReturn: false,
    returnDate: '',
    returnTime: '',
    returnFlightNumber: '',
    vipAirportPickup: false,
    oversizedLuggage: false,
    priceOverride: '',
    sendConfirmation: true,
  })

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (['pickupAddress', 'dropoffAddress', 'pickupAddresses', 'passengers', 'vipAirportPickup', 'oversizedLuggage', 'bookReturn', 'serviceType'].includes(field)) {
      setCalculatedPrice(null)
    }
  }

  function addPickup() {
    if (form.pickupAddresses.length < 3) {
      update('pickupAddresses', [...form.pickupAddresses, ''])
    }
  }

  function updatePickup(i, value) {
    const updated = [...form.pickupAddresses]
    updated[i] = value
    update('pickupAddresses', updated)
  }

  function removePickup(i) {
    update('pickupAddresses', form.pickupAddresses.filter((_, idx) => idx !== i))
  }

  async function getPrice() {
    if (!form.pickupAddress || !form.dropoffAddress) {
      setError('Please enter both pickup and drop-off addresses')
      return
    }
    setError('')
    setPricingLoading(true)
    try {
      const { data } = await api.post('/admin/live-pricing', {
        serviceType: form.serviceType,
        pickupAddress: form.pickupAddress,
        pickupAddresses: form.pickupAddresses.filter(Boolean),
        dropoffAddress: form.dropoffAddress,
        passengers: parseInt(form.passengers),
        vipAirportPickup: form.vipAirportPickup,
        oversizedLuggage: form.oversizedLuggage,
        bookReturn: form.bookReturn,
      })
      setCalculatedPrice(data.pricing)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to calculate price')
    } finally {
      setPricingLoading(false)
    }
  }

  async function createBooking() {
    if (!form.pickupAddress || !form.dropoffAddress || !form.date || !form.time || !form.name || !form.email || !form.phone) {
      setError('Please fill in all required fields (addresses, date, time, name, email, phone)')
      return
    }
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        pickupAddresses: form.pickupAddresses.filter(Boolean),
        priceOverride: form.priceOverride ? parseFloat(form.priceOverride) : null,
      }
      const { data } = await api.post('/admin/bookings/create', payload)
      setSuccess(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  async function sendPaymentLink(bookingId) {
    setPaymentLinkLoading(true)
    try {
      await api.post(`/payment/send-payment-link/${bookingId}`)
      setPaymentLinkSent(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send payment link')
    } finally {
      setPaymentLinkLoading(false)
    }
  }

  if (success) {
    const booking = success.booking || {}
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Created</h2>
          <p className="text-gray-600 mb-4">{success.message}</p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-left space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">Reference</span>
              <span className="font-bold">#{booking.referenceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Customer</span>
              <span>{booking.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-bold text-[#d4a843]">${booking.totalPrice?.toFixed(2)} NZD</span>
            </div>
            {booking.pricing?.priceOverride && (
              <div className="text-xs text-amber-600 font-medium">Price was manually overridden</div>
            )}
            {form.sendConfirmation && (
              <div className="text-xs text-green-600 font-medium">Confirmation email sent to {booking.email}</div>
            )}
            {paymentLinkSent && (
              <div className="text-xs text-purple-600 font-medium">Payment link sent to {booking.email}</div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {!paymentLinkSent && booking.totalPrice > 0 && (
              <button
                onClick={() => sendPaymentLink(booking.id)}
                disabled={paymentLinkLoading}
                className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {paymentLinkLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Payment Link to Customer</>
                )}
              </button>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/admin/bookings')}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                View Bookings
              </button>
              <button
                onClick={() => { setSuccess(null); setPaymentLinkSent(false); setForm({ ...form, name: '', email: '', phone: '', notes: '', priceOverride: '', date: '', time: '' }); setCalculatedPrice(null) }}
                className="flex-1 px-4 py-2.5 bg-[#d4a843] text-white rounded-lg text-sm font-medium hover:bg-[#c49a3a]"
              >
                Create Another
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
          )}
        </div>
      </div>
    )
  }

  const finalPrice = form.priceOverride ? parseFloat(form.priceOverride) : calculatedPrice?.totalPrice

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form — left side (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Trip details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#d4a843]" />
              Trip Details
            </h2>

            <div className="space-y-4">
              {/* Service type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {SERVICE_TYPES.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => update('serviceType', st.id)}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                        form.serviceType === st.id
                          ? 'border-[#d4a843] bg-amber-50 text-[#d4a843]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <st.icon className="w-4 h-4" />
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <AddressInput
                label="Pickup Address *"
                value={form.pickupAddress}
                onChange={(v) => update('pickupAddress', v)}
                placeholder="e.g. 123 Queen Street, Auckland"
              />

              {form.pickupAddresses.map((addr, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex-1">
                    <AddressInput
                      label={`Additional Pickup ${i + 1}`}
                      value={addr}
                      onChange={(v) => updatePickup(i, v)}
                      placeholder="Additional pickup address"
                    />
                  </div>
                  <button onClick={() => removePickup(i)} className="self-end p-3 text-gray-400 hover:text-red-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {form.pickupAddresses.length < 3 && (
                <button onClick={addPickup} className="text-sm text-[#d4a843] font-medium flex items-center gap-1 hover:underline">
                  <Plus className="w-4 h-4" /> Add another pickup
                </button>
              )}

              <AddressInput
                label="Drop-off Address *"
                value={form.dropoffAddress}
                onChange={(v) => update('dropoffAddress', v)}
                placeholder="e.g. Auckland Airport"
                icon={Plane}
              />

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => update('date', e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843]/40 focus:border-[#d4a843]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Time *</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => update('time', e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843]/40 focus:border-[#d4a843]"
                    />
                  </div>
                </div>
              </div>

              {/* Passengers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Passengers</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={form.passengers}
                    onChange={(e) => update('passengers', e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843]/40 focus:border-[#d4a843] bg-white appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
                      <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Flight numbers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Departure Flight</label>
                  <input
                    type="text"
                    value={form.departureFlightNumber}
                    onChange={(e) => update('departureFlightNumber', e.target.value)}
                    placeholder="e.g. NZ123"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843]/40 focus:border-[#d4a843]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Arrival Flight</label>
                  <input
                    type="text"
                    value={form.arrivalFlightNumber}
                    onChange={(e) => update('arrivalFlightNumber', e.target.value)}
                    placeholder="e.g. NZ456"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843]/40 focus:border-[#d4a843]"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Options</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => update('vipAirportPickup', !form.vipAirportPickup)}
                    className={`flex items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      form.vipAirportPickup ? 'border-[#d4a843] bg-amber-50 text-[#d4a843]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    VIP (+$15)
                  </button>
                  <button
                    onClick={() => update('oversizedLuggage', !form.oversizedLuggage)}
                    className={`flex items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      form.oversizedLuggage ? 'border-[#d4a843] bg-amber-50 text-[#d4a843]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Luggage className="w-3.5 h-3.5" />
                    Luggage (+$25)
                  </button>
                  <button
                    onClick={() => update('bookReturn', !form.bookReturn)}
                    className={`flex items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      form.bookReturn ? 'border-[#d4a843] bg-amber-50 text-[#d4a843]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Return
                  </button>
                </div>
              </div>

              {/* Return details */}
              {form.bookReturn && (
                <div className="grid grid-cols-3 gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Return Date</label>
                    <input
                      type="date"
                      value={form.returnDate}
                      onChange={(e) => update('returnDate', e.target.value)}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Return Time</label>
                    <input
                      type="time"
                      value={form.returnTime}
                      onChange={(e) => update('returnTime', e.target.value)}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Return Flight</label>
                    <input
                      type="text"
                      value={form.returnFlightNumber}
                      onChange={(e) => update('returnFlightNumber', e.target.value)}
                      placeholder="e.g. NZ789"
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <User className="w-5 h-5 text-[#d4a843]" />
              Customer Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="Customer full name"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843]/40 focus:border-[#d4a843]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="customer@email.com"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843]/40 focus:border-[#d4a843]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      placeholder="021 123 4567"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843]/40 focus:border-[#d4a843]"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  rows={3}
                  placeholder="Any special requirements or notes..."
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843]/40 focus:border-[#d4a843] resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right side — pricing & submit (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calculate price */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#d4a843]" />
              Pricing
            </h2>

            <button
              onClick={getPrice}
              disabled={!form.pickupAddress || !form.dropoffAddress || pricingLoading}
              className="w-full bg-gray-100 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2 mb-4"
            >
              {pricingLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Calculating...</>
              ) : (
                <><DollarSign className="w-4 h-4" /> Calculate Price</>
              )}
            </button>

            {calculatedPrice && (
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Distance</span>
                  <span>{calculatedPrice.distance?.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rate</span>
                  <span>${calculatedPrice.ratePerKm?.toFixed(2)}/km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Base</span>
                  <span>${calculatedPrice.basePrice?.toFixed(2)}</span>
                </div>
                {calculatedPrice.airportFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">VIP</span>
                    <span>${calculatedPrice.airportFee?.toFixed(2)}</span>
                  </div>
                )}
                {calculatedPrice.stripeFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Card Fee</span>
                    <span>${calculatedPrice.stripeFee?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-gray-200 pt-2">
                  <span>Calculated Total</span>
                  <span className="text-[#d4a843]">${calculatedPrice.totalPrice?.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Price override */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Price Override <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.priceOverride}
                  onChange={(e) => update('priceOverride', e.target.value)}
                  placeholder={calculatedPrice ? calculatedPrice.totalPrice?.toFixed(2) : 'Leave blank for auto pricing'}
                  className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843]/40 focus:border-[#d4a843]"
                />
              </div>
              {form.priceOverride && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Calculated price will be overridden with ${parseFloat(form.priceOverride).toFixed(2)}
                </div>
              )}
            </div>

            {/* Final price display */}
            {finalPrice && (
              <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 text-center mt-4">
                <div className="text-white/60 text-xs mb-1">{form.priceOverride ? 'Override Price' : 'Total Price'}</div>
                <div className="text-3xl font-bold text-[#d4a843]">${finalPrice.toFixed(2)}</div>
                <div className="text-white/50 text-xs mt-1">NZD</div>
              </div>
            )}
          </div>

          {/* Send confirmation toggle */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sendConfirmation}
                onChange={(e) => update('sendConfirmation', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#d4a843] focus:ring-[#d4a843]"
              />
              <div>
                <div className="text-sm font-medium text-gray-700">Send confirmation email</div>
                <div className="text-xs text-gray-400">Customer will receive booking confirmation from noreply@bookaride.co.nz</div>
              </div>
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
          )}

          {/* Submit */}
          <button
            onClick={createBooking}
            disabled={loading || !form.pickupAddress || !form.dropoffAddress || !form.date || !form.time || !form.name || !form.email || !form.phone}
            className="w-full bg-green-600 text-white font-semibold py-3.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Creating Booking...</>
            ) : (
              <><Send className="w-5 h-5" /> Create Booking & Send Confirmation</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
