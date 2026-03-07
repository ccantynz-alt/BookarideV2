import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Users, ArrowRight, ArrowLeft, Loader2,
  CheckCircle, Plus, X, Luggage, Star, RotateCcw,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import api from '../../lib/api'
import AddressInput from '../booking/AddressInput'
import DateTimePicker from '../booking/DateTimePicker'
import PriceBreakdown from '../booking/PriceBreakdown'

const STEPS = ['Trip Details', 'Your Details', 'Confirm & Pay']

const AIRPORT_PRESETS = [
  { label: 'Auckland Airport', address: 'Auckland Airport, Ray Emery Drive, Mangere, Auckland, New Zealand' },
  { label: 'Hamilton Airport', address: 'Hamilton Airport, Airport Road, Hamilton, New Zealand' },
  { label: 'Whangarei Airport', address: 'Whangarei Airport, Handforth Street, Whangarei, New Zealand' },
]

export default function BookNow() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [priceLoading, setPriceLoading] = useState(false)
  const [error, setError] = useState('')
  const [pricing, setPricing] = useState(null)
  const calcDebounce = useRef(null)

  const [form, setForm] = useState({
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
  })

  // Load returning customer details
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bookaride_customer') || 'null')
      if (saved?.name) {
        setForm((prev) => ({ ...prev, name: saved.name, email: saved.email || '', phone: saved.phone || '' }))
      }
    } catch {}
  }, [])

  function update(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      return next
    })
    if (['pickupAddress', 'dropoffAddress', 'passengers', 'vipAirportPickup', 'oversizedLuggage', 'bookReturn', 'returnDate', 'returnTime'].includes(field)) {
      setPricing(null)
    }
  }

  function addPickup() {
    if (form.pickupAddresses.length < 3) update('pickupAddresses', [...form.pickupAddresses, ''])
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

  // Auto-calculate when both addresses are filled
  useEffect(() => {
    if (!form.pickupAddress || !form.dropoffAddress) return
    if (calcDebounce.current) clearTimeout(calcDebounce.current)
    calcDebounce.current = setTimeout(() => {
      calculatePrice(form)
    }, 600)
    return () => clearTimeout(calcDebounce.current)
  }, [form.pickupAddress, form.dropoffAddress, form.pickupAddresses, form.passengers, form.vipAirportPickup, form.oversizedLuggage, form.bookReturn, form.returnDate, form.returnTime])

  async function calculatePrice(f = form) {
    if (!f.pickupAddress || !f.dropoffAddress) return
    setError('')
    setPriceLoading(true)
    try {
      const { data } = await api.post('/calculate-price', {
        serviceType: 'airport-transfer',
        pickupAddress: f.pickupAddress,
        pickupAddresses: f.pickupAddresses.filter(Boolean),
        dropoffAddress: f.dropoffAddress,
        passengers: parseInt(f.passengers) || 1,
        vipAirportPickup: f.vipAirportPickup,
        oversizedLuggage: f.oversizedLuggage,
        bookReturn: !!(f.bookReturn && f.returnDate && f.returnTime),
      })
      setPricing(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to calculate price — please check addresses')
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
    setError('')
    setLoading(true)
    try {
      // Save customer for next visit
      localStorage.setItem('bookaride_customer', JSON.stringify({ name: form.name, email: form.email, phone: form.phone }))

      const { data: booking } = await api.post('/bookings', {
        ...form,
        serviceType: 'airport-transfer',
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
      })

      const { data: checkout } = await api.post('/payment/create-checkout', { booking_id: booking.id })
      if (checkout.url) { window.location.href = checkout.url; return }
      navigate(`/payment/success?booking_id=${booking.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create booking — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-88px)] bg-gradient-to-br from-gray-50 to-white py-12">
      <div className="container-max px-4 sm:px-6 lg:px-8 max-w-3xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Book Your Transfer</h1>
          <p className="text-gray-500">Get an instant price — no obligation, no hidden fees.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                i < step ? 'bg-gold text-black' : i === step ? 'bg-gray-900 text-gold border-2 border-gold' : 'bg-gray-200 text-gray-500'
              )}>
                {i < step ? <CheckCircle className="w-5 h-5" /> : i + 1}
              </div>
              <span className={cn('text-sm font-medium hidden sm:block', i <= step ? 'text-gray-900' : 'text-gray-400')}>{s}</span>
              {i < STEPS.length - 1 && <div className={cn('w-8 h-0.5 mx-1', i < step ? 'bg-gold' : 'bg-gray-200')} />}
            </div>
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />{error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ── Step 0: Trip Details ── */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 sm:p-8 space-y-5">

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
                    <button onClick={() => removePickup(i)} className="self-end p-3 text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {form.pickupAddresses.length < 3 && (
                  <button onClick={addPickup} className="text-sm text-gold font-medium flex items-center gap-1 hover:underline">
                    <Plus className="w-4 h-4" /> Add another pickup
                  </button>
                )}

                {/* Drop-off with quick-select */}
                <div>
                  <AddressInput
                    label="Drop-off Address"
                    value={form.dropoffAddress}
                    onChange={(v) => update('dropoffAddress', v)}
                    placeholder="e.g. Auckland Airport"
                    icon={MapPin}
                  />
                  {/* Quick-select airports */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {AIRPORT_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => update('dropoffAddress', p.address)}
                        className={cn(
                          'text-xs px-3 py-1.5 rounded-full border font-medium transition-all',
                          form.dropoffAddress === p.address
                            ? 'bg-gold text-black border-gold'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gold hover:text-gold'
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

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
                    <select value={form.passengers} onChange={(e) => update('passengers', e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold bg-white appearance-none">
                      {[1,2,3,4,5,6,7,8,9,10,11].map((n) => (
                        <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Flight numbers */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Departure Flight</label>
                    <input type="text" value={form.departureFlightNumber} onChange={(e) => update('departureFlightNumber', e.target.value.toUpperCase())}
                      placeholder="e.g. NZ1" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Arrival Flight</label>
                    <input type="text" value={form.arrivalFlightNumber} onChange={(e) => update('arrivalFlightNumber', e.target.value.toUpperCase())}
                      placeholder="e.g. QF145" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold" />
                  </div>
                </div>

                {/* Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { key: 'vipAirportPickup', label: 'VIP Pickup', sub: '+$15', icon: Star },
                      { key: 'oversizedLuggage', label: 'Large Luggage', sub: '+$25', icon: Luggage },
                      { key: 'bookReturn', label: 'Return Trip', sub: 'Add return', icon: RotateCcw },
                    ].map(({ key, label, sub, icon: Icon }) => (
                      <button key={key} onClick={() => update(key, !form[key])}
                        className={cn('flex items-center gap-2 p-3 rounded-lg border text-sm transition-all',
                          form[key] ? 'border-gold bg-gold/5 text-gold' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{label}</span>
                        <span className="text-xs text-gray-400 ml-auto">{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Return details */}
                <AnimatePresence>
                  {form.bookReturn && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                      <DateTimePicker dateLabel="Return Date" timeLabel="Return Time" date={form.returnDate} time={form.returnTime}
                        onDateChange={(v) => update('returnDate', v)} onTimeChange={(v) => update('returnTime', v)} minDate={form.date} />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Return Flight Number <span className="text-red-500">*</span></label>
                        <input type="text" value={form.returnFlightNumber} onChange={(e) => update('returnFlightNumber', e.target.value.toUpperCase())}
                          placeholder="e.g. NZ123" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Price area */}
                {priceLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gold" /> Calculating price...
                  </div>
                )}
                {pricing && <PriceBreakdown pricing={pricing} bookReturn={form.bookReturn && !!(form.returnDate && form.returnTime)} />}

                <button
                  onClick={() => canProceedStep0() ? (setError(''), setStep(1)) : setError('Please fill in pickup, drop-off, date and time to continue')}
                  disabled={!form.pickupAddress || !form.dropoffAddress}
                  className="w-full h-14 bg-gold hover:bg-yellow-500 disabled:bg-gray-200 disabled:text-gray-400 text-black font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-gold/30 hover:scale-[1.02] disabled:scale-100 disabled:shadow-none"
                >
                  {pricing ? (<>Continue <ArrowRight className="w-5 h-5" /></>) : (<>Enter addresses above to see your price</>)}
                </button>
              </motion.div>
            )}

            {/* ── Step 1: Your Details ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 sm:p-8 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="John Smith"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="john@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+64 21 123 4567"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Requests <span className="text-gray-400">(optional)</span></label>
                  <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)}
                    placeholder="Child seat required, meet at arrivals, etc." rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold resize-none" />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(0)} className="flex-1 h-12 border-2 border-gray-200 text-gray-600 hover:border-gray-300 font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                    <ArrowLeft className="w-5 h-5" /> Back
                  </button>
                  <button
                    onClick={() => canProceedStep1() ? (setError(''), setStep(2)) : setError('Please fill in name, email and phone')}
                    className="flex-1 h-12 bg-gold hover:bg-yellow-500 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-gold/30"
                  >
                    Review Booking <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Confirm & Pay ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 sm:p-8 space-y-5">
                <h2 className="text-lg font-semibold text-gray-900">Booking Summary</h2>

                <div className="bg-gray-50 rounded-xl p-5 space-y-3 text-sm">
                  <Row label="Pickup" value={form.pickupAddress} />
                  {form.pickupAddresses.filter(Boolean).map((a, i) => <Row key={i} label={`Stop ${i + 1}`} value={a} />)}
                  <Row label="Drop-off" value={form.dropoffAddress} />
                  <Row label="Date & Time" value={`${form.date} at ${formatTime12h(form.time)}`} />
                  <Row label="Passengers" value={form.passengers} />
                  {form.bookReturn && form.returnDate && <Row label="Return" value={`${form.returnDate} at ${form.returnTime}`} />}
                  {form.departureFlightNumber && <Row label="Departure Flight" value={form.departureFlightNumber} />}
                  {form.arrivalFlightNumber && <Row label="Arrival Flight" value={form.arrivalFlightNumber} />}
                  {form.vipAirportPickup && <Row label="VIP Pickup" value="Included" />}
                  {form.oversizedLuggage && <Row label="Oversized Luggage" value="Included" />}
                </div>

                <div className="bg-gray-50 rounded-xl p-5 space-y-2 text-sm">
                  <Row label="Name" value={form.name} />
                  <Row label="Email" value={form.email} />
                  <Row label="Phone" value={form.phone} />
                  {form.notes && <Row label="Notes" value={form.notes} />}
                </div>

                <PriceBreakdown pricing={pricing} bookReturn={form.bookReturn && !!(form.returnDate && form.returnTime)} />

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 h-12 border-2 border-gray-200 text-gray-600 hover:border-gray-300 font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                    <ArrowLeft className="w-5 h-5" /> Back
                  </button>
                  <button onClick={submitBooking} disabled={loading}
                    className="flex-1 h-12 bg-gold hover:bg-yellow-500 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-gold/30 disabled:opacity-60">
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><CheckCircle className="w-5 h-5" /> Pay ${pricing?.totalPrice?.toFixed(2)} NZD</>}
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center">Secure payment via Stripe. Your details are encrypted.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Trust row */}
        <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-gray-500">
          {['Fixed prices — no surprises', 'Flight tracking included', 'Free cancellation 24h', '10,000+ happy customers'].map((t) => (
            <span key={t} className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-gold" />{t}</span>
          ))}
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
