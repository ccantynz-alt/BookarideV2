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
  ArrowRight,
  Plus,
  X,
  Info,
} from 'lucide-react'
import api from '../../lib/api'
import AddressInput from '../booking/AddressInput'

const SERVICE_TYPES = [
  { id: 'airport-transfer', label: 'Airport Transfer', icon: Plane },
  { id: 'point-to-point', label: 'Point to Point', icon: MapPin },
]

export default function AdminLivePricing() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pricing, setPricing] = useState(null)
  const [enquiries, setEnquiries] = useState([])

  const [form, setForm] = useState({
    serviceType: 'airport-transfer',
    pickupAddress: '',
    pickupAddresses: [],
    dropoffAddress: '',
    passengers: 1,
    vipAirportPickup: false,
    oversizedLuggage: false,
    bookReturn: false,
  })

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setPricing(null)
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
    setLoading(true)
    try {
      const { data } = await api.post('/admin/live-pricing', {
        serviceType: form.serviceType,
        pickupAddress: form.pickupAddress,
        pickupAddresses: form.pickupAddresses.filter(Boolean),
        dropoffAddress: form.dropoffAddress,
        passengers: form.passengers,
        vipAirportPickup: form.vipAirportPickup,
        oversizedLuggage: form.oversizedLuggage,
        bookReturn: form.bookReturn,
      })
      setPricing(data.pricing)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to calculate price')
    } finally {
      setLoading(false)
    }
  }

  function proceedToBooking() {
    // Pre-fill the public booking form
    const params = new URLSearchParams({
      serviceType: form.serviceType,
      pickup: form.pickupAddress,
      dropoff: form.dropoffAddress,
      passengers: form.passengers.toString(),
    })
    window.open(`/book-now?${params.toString()}`, '_blank')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <strong>Live Pricing Tool</strong> — Use this to give customers a quick price estimate
          without creating a booking. If the customer wants to proceed, use the &ldquo;Proceed to Booking&rdquo;
          button to open the booking form with pre-filled details.
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#d4a843]" />
            Price Calculator
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

            {/* Pickup */}
            <AddressInput
              label="Pickup Address"
              value={form.pickupAddress}
              onChange={(v) => update('pickupAddress', v)}
              placeholder="e.g. 123 Queen Street, Auckland"
            />

            {/* Additional pickups */}
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

            {/* Dropoff */}
            <AddressInput
              label="Drop-off Address"
              value={form.dropoffAddress}
              onChange={(v) => update('dropoffAddress', v)}
              placeholder="e.g. Auckland Airport"
              icon={Plane}
            />

            {/* Passengers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Passengers</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={form.passengers}
                  onChange={(e) => update('passengers', parseInt(e.target.value))}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#d4a843]/40 focus:border-[#d4a843] bg-white appearance-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
                    <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
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

            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

            <button
              onClick={getPrice}
              disabled={!form.pickupAddress || !form.dropoffAddress || loading}
              className="w-full bg-[#d4a843] text-white font-semibold py-3 rounded-lg hover:bg-[#c49a3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Calculating...</>
              ) : (
                <><DollarSign className="w-5 h-5" /> Get Price</>
              )}
            </button>
          </div>
        </div>

        {/* Result */}
        <div>
          {pricing ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Price Estimate</h2>

              <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-6 text-center mb-5">
                <div className="text-white/60 text-sm mb-1">Estimated Total</div>
                <div className="text-4xl font-bold text-[#d4a843]">${pricing.totalPrice?.toFixed(2)}</div>
                <div className="text-white/50 text-sm mt-1">NZD (inc. card fee)</div>
              </div>

              <div className="space-y-2 text-sm mb-5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Distance</span>
                  <span className="text-gray-700">{pricing.distance?.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rate</span>
                  <span className="text-gray-700">${pricing.ratePerKm?.toFixed(2)}/km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Base Fare</span>
                  <span className="text-gray-700">${pricing.basePrice?.toFixed(2)}</span>
                </div>
                {pricing.airportFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">VIP Airport Pickup</span>
                    <span className="text-gray-700">${pricing.airportFee?.toFixed(2)}</span>
                  </div>
                )}
                {pricing.oversizedLuggageFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Oversized Luggage</span>
                    <span className="text-gray-700">${pricing.oversizedLuggageFee?.toFixed(2)}</span>
                  </div>
                )}
                {pricing.passengerFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Extra Passengers</span>
                    <span className="text-gray-700">${pricing.passengerFee?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-700">${pricing.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Card Fee</span>
                  <span className="text-gray-700">${pricing.stripeFee?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-gray-200 pt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-[#d4a843]">${pricing.totalPrice?.toFixed(2)} NZD</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 mb-4">
                This is a price estimate only. No booking has been created. The customer can proceed
                to the booking form to complete their reservation and payment.
              </div>

              <button
                onClick={proceedToBooking}
                className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                Proceed to Booking <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Enter trip details and click &ldquo;Get Price&rdquo; to see the estimate</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
