import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plane,
  MapPin,
  Users,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Plus,
  X,
  Luggage,
  Star,
  RotateCcw,
  Car,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import api from '../../lib/api'
import AddressInput from '../booking/AddressInput'
import DateTimePicker from '../booking/DateTimePicker'
import PriceBreakdown from '../booking/PriceBreakdown'

const SERVICE_TYPES = [
  { id: 'private-shuttle', label: 'Private Shuttle Service', icon: Car },
  { id: 'airport-shuttle', label: 'Airport Shuttle', icon: Plane },
]

function formatTime12h(t) {
  if (!t) return t
  const [hStr, m] = t.split(':')
  const h = parseInt(hStr, 10)
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m} ${period}`
}

const STEPS = ['Trip Details', 'Your Details', 'Confirm & Pay']

export default function BookNow() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [priceLoading, setPriceLoading] = useState(false)
  const [error, setError] = useState('')
  const [pricing, setPricing] = useState(null)

  const [form, setForm] = useState({
    serviceType: 'private-shuttle',
    pickupAddress: '',
    pickupAddresses: [],
    dropoffAddress: '',
    date: '',
    time: '',
    passengers: '1',
    vipAirportPickup: false,
    oversizedLuggage: false,
    bookReturn: false,
    returnDate: '',
    returnTime: '',
    returnFlightNumber: '',
    departureFlightNumber: '',
    arrivalFlightNumber: '',
    name: '',
    email: '',
    phone: '',
    notes: '',
    paymentMethod: 'card',
  })

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear pricing when trip details change
    if (['pickupAddress', 'dropoffAddress', 'passengers', 'vipAirportPickup', 'oversizedLuggage', 'bookReturn'].includes(field)) {
      setPricing(null)
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
    setPricing(null)
  }

  function removePickup(i) {
    update('pickupAddresses', form.pickupAddresses.filter((_, idx) => idx !== i))
    setPricing(null)
  }

  async function getPrice() {
    if (!form.pickupAddress || !form.dropoffAddress) {
      setError('Please enter both pickup and drop-off addresses')
      return
    }
    setError('')
    setPriceLoading(true)
    try {
      const { data } = await api.post('/calculate-price', {
        serviceType: form.serviceType,
        pickupAddress: form.pickupAddress,
        pickupAddresses: form.pickupAddresses.filter(Boolean),
        dropoffAddress: form.dropoffAddress,
        passengers: parseInt(form.passengers) || 1,
        vipAirportPickup: form.vipAirportPickup,
        oversizedLuggage: form.oversizedLuggage,
        bookReturn: form.bookReturn,
      })
      setPricing(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to calculate price')
    } finally {
      setPriceLoading(false)
    }
  }

  function canProceedStep0() {
    return form.pickupAddress && form.dropoffAddress && form.date && form.time && pricing
  }

  function canProceedStep1() {
    return form.name && form.email && form.phone
  }

  async function submitBooking() {
    if (form.bookReturn && !form.returnFlightNumber && form.serviceType === 'airport-shuttle') {
      setError('Return flight number is required for airport transfers')
      return
    }

    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        passengers: form.passengers,
        pricing: {
          distance: pricing.distance,
          basePrice: pricing.basePrice,
          airportFee: pricing.airportFee,
          oversizedLuggageFee: pricing.oversizedLuggageFee,
          passengerFee: pricing.passengerFee,
          stripeFee: pricing.stripeFee,
          subtotal: pricing.subtotal,
          totalPrice: pricing.totalPrice,
          ratePerKm: pricing.ratePerKm,
        },
        returnDepartureFlightNumber: form.returnFlightNumber,
      }

      const { data: booking } = await api.post('/bookings', payload)

      // If card payment, create Stripe checkout
      if (form.paymentMethod === 'card') {
        const { data: checkout } = await api.post('/payment/create-checkout', {
          booking_id: booking.id,
        })
        if (checkout.url) {
          window.location.href = checkout.url
          return
        }
      }

      // Otherwise go to success page
      navigate(`/payment-success?booking_id=${booking.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="section-padding bg-gray-50 min-h-screen">
      <div className="container-max max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Book Your Transfer
          </h1>
          <p className="text-gray-500">
            Get an instant price and book in minutes.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                i <= step ? 'bg-gold text-white' : 'bg-gray-200 text-gray-500'
              )}>
                {i < step ? <CheckCircle className="w-5 h-5" /> : i + 1}
              </div>
              <span className={cn(
                'text-sm font-medium hidden sm:block',
                i <= step ? 'text-gray-900' : 'text-gray-400'
              )}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className={cn('w-8 h-0.5 mx-1', i < step ? 'bg-gold' : 'bg-gray-200')} />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <AnimatePresence mode="wait">
            {/* ── Step 0: Trip Details ─────────────────────────── */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Service type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {SERVICE_TYPES.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => update('serviceType', st.id)}
                        className={cn(
                          'flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all',
                          form.serviceType === st.id
                            ? 'border-gold bg-gold-50 text-gold'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        )}
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
                    <button
                      onClick={() => removePickup(i)}
                      className="self-end p-3 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {form.pickupAddresses.length < 3 && (
                  <button
                    onClick={addPickup}
                    className="text-sm text-gold font-medium flex items-center gap-1 hover:underline"
                  >
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

                {/* Date & Time */}
                <DateTimePicker
                  date={form.date}
                  time={form.time}
                  onDateChange={(v) => update('date', v)}
                  onTimeChange={(v) => update('time', v)}
                />

                {/* Passengers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Passengers</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={form.passengers}
                      onChange={(e) => update('passengers', e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold bg-white appearance-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
                        <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Add-ons */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Options</label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => update('vipAirportPickup', !form.vipAirportPickup)}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg border text-sm transition-all',
                        form.vipAirportPickup ? 'border-gold bg-gold-50 text-gold' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      <Star className="w-4 h-4" />
                      VIP Pickup (+$15)
                    </button>
                    <button
                      onClick={() => update('oversizedLuggage', !form.oversizedLuggage)}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg border text-sm transition-all',
                        form.oversizedLuggage ? 'border-gold bg-gold-50 text-gold' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      <Luggage className="w-4 h-4" />
                      Large Luggage (+$25)
                    </button>
                    <button
                      onClick={() => update('bookReturn', !form.bookReturn)}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg border text-sm transition-all',
                        form.bookReturn ? 'border-gold bg-gold-50 text-gold' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Return Trip
                    </button>
                  </div>
                </div>

                {/* Return trip details */}
                <AnimatePresence>
                  {form.bookReturn && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <DateTimePicker
                        dateLabel="Return Date"
                        timeLabel="Return Time"
                        date={form.returnDate}
                        time={form.returnTime}
                        onDateChange={(v) => update('returnDate', v)}
                        onTimeChange={(v) => update('returnTime', v)}
                        minDate={form.date}
                      />
                      {form.serviceType === 'airport-shuttle' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Return Flight Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={form.returnFlightNumber}
                            onChange={(e) => update('returnFlightNumber', e.target.value.toUpperCase())}
                            placeholder="e.g. NZ123"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold"
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Flight numbers */}
                {form.serviceType === 'airport-shuttle' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Departure Flight</label>
                      <input
                        type="text"
                        value={form.departureFlightNumber}
                        onChange={(e) => update('departureFlightNumber', e.target.value.toUpperCase())}
                        placeholder="e.g. NZ1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Arrival Flight</label>
                      <input
                        type="text"
                        value={form.arrivalFlightNumber}
                        onChange={(e) => update('arrivalFlightNumber', e.target.value.toUpperCase())}
                        placeholder="e.g. QF145"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold"
                      />
                    </div>
                  </div>
                )}

                {/* Get Price button */}
                <button
                  onClick={getPrice}
                  disabled={!form.pickupAddress || !form.dropoffAddress || priceLoading}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {priceLoading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Calculating...</>
                  ) : (
                    'Get Price'
                  )}
                </button>

                {/* Price breakdown */}
                <PriceBreakdown pricing={pricing} bookReturn={form.bookReturn} />

                {/* Next */}
                {pricing && (
                  <button
                    onClick={() => canProceedStep0() ? setStep(1) : setError('Please fill in date and time')}
                    className="btn-primary w-full"
                  >
                    Continue <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                )}
              </motion.div>
            )}

            {/* ── Step 1: Your Details ────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="+64 21 123 4567"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => update('notes', e.target.value)}
                    placeholder="Child seat needed, meet at arrivals, etc."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(0)} className="btn-secondary flex-1">
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back
                  </button>
                  <button
                    onClick={() => canProceedStep1() ? setStep(2) : setError('Please fill in all required fields')}
                    className="btn-primary flex-1"
                  >
                    Review Booking <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Confirm & Pay ───────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <h2 className="text-lg font-semibold text-gray-900">Booking Summary</h2>

                <div className="bg-gray-50 rounded-xl p-5 space-y-3 text-sm">
                  <Row label="Service" value={SERVICE_TYPES.find(s => s.id === form.serviceType)?.label} />
                  <Row label="Pickup" value={form.pickupAddress} />
                  {form.pickupAddresses.filter(Boolean).map((a, i) => (
                    <Row key={i} label={`Stop ${i + 1}`} value={a} />
                  ))}
                  <Row label="Drop-off" value={form.dropoffAddress} />
                  <Row label="Date & Time" value={`${form.date} at ${formatTime12h(form.time)}`} />
                  <Row label="Passengers" value={form.passengers} />
                  {form.bookReturn && <Row label="Return" value={`${form.returnDate} at ${formatTime12h(form.returnTime)}`} />}
                  {form.departureFlightNumber && <Row label="Departure Flight" value={form.departureFlightNumber} />}
                  {form.arrivalFlightNumber && <Row label="Arrival Flight" value={form.arrivalFlightNumber} />}
                  {form.vipAirportPickup && <Row label="VIP Pickup" value="Yes" />}
                  {form.oversizedLuggage && <Row label="Oversized Luggage" value="Yes" />}
                </div>

                <div className="bg-gray-50 rounded-xl p-5 space-y-2 text-sm">
                  <Row label="Name" value={form.name} />
                  <Row label="Email" value={form.email} />
                  <Row label="Phone" value={form.phone} />
                  {form.notes && <Row label="Notes" value={form.notes} />}
                </div>

                <PriceBreakdown pricing={pricing} bookReturn={form.bookReturn} />

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back
                  </button>
                  <button
                    onClick={submitBooking}
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      <><CheckCircle className="w-5 h-5 mr-2" /> Pay ${pricing?.totalPrice?.toFixed(2)} NZD</>
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  You&apos;ll be redirected to Stripe for secure payment.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium text-right">{value}</span>
    </div>
  )
}
