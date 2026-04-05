/**
 * BookNow — Premium multi-step booking wizard.
 *
 * Uses useBookingForm hook for all state management.
 * Three steps: Trip Details → Your Details → Confirm & Pay
 */

import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Users, ArrowRight, ArrowLeft, Loader2,
  CheckCircle, Plus, X, Luggage, Star, RotateCcw, Plane,
  Shield, Clock as ClockIcon,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import useBookingForm from '../../hooks/useBookingForm'
import AddressInput from '../booking/AddressInput'
import DateTimePicker from '../booking/DateTimePicker'
import PriceBreakdown from '../booking/PriceBreakdown'
import BookingSummary from '../booking/BookingSummary'
import StepIndicator from '../booking/StepIndicator'

const AIRPORT_PRESETS = [
  { label: 'Auckland Airport', address: 'Auckland Airport, Ray Emery Drive, Mangere, Auckland, New Zealand' },
  { label: 'Hamilton Airport', address: 'Hamilton Airport, Airport Road, Hamilton, New Zealand' },
  { label: 'Whangarei Airport', address: 'Whangarei Airport, Handforth Street, Whangarei, New Zealand' },
]

// Animation variants for step transitions
const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
}

export default function BookNow() {
  const {
    form, step, pricing, priceLoading, submitting, error, fieldErrors,
    updateField, addPickup, updatePickup, removePickup,
    goToStep, submitBooking, setError,
  } = useBookingForm()

  const hasReturnDetails = form.bookReturn && form.returnDate && form.returnTime

  return (
    <div className="min-h-[calc(100vh-88px)] bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8 sm:py-12">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            Book Your Transfer
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Instant pricing — no obligation, no hidden fees
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} />

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-2"
              role="alert"
              data-testid="error-banner"
            >
              <X className="w-4 h-4 shrink-0 mt-0.5 cursor-pointer hover:text-red-900" onClick={() => setError('')} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ────────────────────────────────────────────────
                STEP 0: Trip Details
               ───────���──────────────────────────────────────── */}
            {step === 0 && (
              <motion.div
                key="step0"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="p-6 sm:p-8 space-y-5"
              >
                {/* Pickup Address */}
                <AddressInput
                  label="Pickup Address"
                  value={form.pickupAddress}
                  onChange={(v) => updateField('pickupAddress', v)}
                  placeholder="e.g. 123 Queen Street, Auckland"
                  error={fieldErrors.pickupAddress}
                  required
                />

                {/* Additional Pickups */}
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
                      aria-label={`Remove additional pickup ${i + 1}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {form.pickupAddresses.length < 3 && (
                  <button
                    onClick={addPickup}
                    className="text-sm text-gold font-medium flex items-center gap-1 hover:underline"
                    data-testid="add-pickup-button"
                  >
                    <Plus className="w-4 h-4" /> Add another pickup
                  </button>
                )}

                {/* Drop-off Address with Airport Quick-Select */}
                <div>
                  <AddressInput
                    label="Drop-off Address"
                    value={form.dropoffAddress}
                    onChange={(v) => updateField('dropoffAddress', v)}
                    placeholder="e.g. Auckland Airport"
                    icon={MapPin}
                    error={fieldErrors.dropoffAddress}
                    required
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {AIRPORT_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => updateField('dropoffAddress', p.address)}
                        className={cn(
                          'text-xs px-3 py-1.5 rounded-full border font-medium transition-all',
                          form.dropoffAddress === p.address
                            ? 'bg-gold text-black border-gold shadow-sm'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gold hover:text-gold'
                        )}
                        data-testid={`airport-preset-${p.label.toLowerCase().replace(/\s+/g, '-')}`}
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
                  onDateChange={(v) => updateField('date', v)}
                  onTimeChange={(v) => updateField('time', v)}
                  dateError={fieldErrors.date}
                  timeError={fieldErrors.time}
                />

                {/* Passengers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Passengers <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={form.passengers}
                      onChange={(e) => updateField('passengers', e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold bg-white appearance-none cursor-pointer"
                      data-testid="passengers-select"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11].map((n) => (
                        <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Flight Numbers */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1"><Plane className="w-3.5 h-3.5" /> Departure Flight</span>
                    </label>
                    <input
                      type="text"
                      value={form.departureFlightNumber}
                      onChange={(e) => updateField('departureFlightNumber', e.target.value.toUpperCase())}
                      placeholder="e.g. NZ1"
                      maxLength={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold uppercase"
                      data-testid="departure-flight-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-1"><Plane className="w-3.5 h-3.5" /> Arrival Flight</span>
                    </label>
                    <input
                      type="text"
                      value={form.arrivalFlightNumber}
                      onChange={(e) => updateField('arrivalFlightNumber', e.target.value.toUpperCase())}
                      placeholder="e.g. QF145"
                      maxLength={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold uppercase"
                      data-testid="arrival-flight-input"
                    />
                  </div>
                </div>

                {/* Options (VIP, Luggage, Return) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { key: 'vipAirportPickup', label: 'VIP Pickup', sub: '+$15', icon: Star },
                      { key: 'oversizedLuggage', label: 'Large Luggage', sub: '+$25', icon: Luggage },
                      { key: 'bookReturn', label: 'Return Trip', sub: 'Add return', icon: RotateCcw },
                    ].map(({ key, label, sub, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => updateField(key, !form[key])}
                        className={cn(
                          'flex items-center gap-2 p-3 rounded-lg border text-sm transition-all duration-200',
                          form[key]
                            ? 'border-gold bg-gold/5 text-gold shadow-sm'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        )}
                        data-testid={`option-${key}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{label}</span>
                        <span className="text-xs text-gray-400 ml-auto">{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Return Trip Details */}
                <AnimatePresence>
                  {form.bookReturn && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="bg-gold-50/30 border border-gold/20 rounded-xl p-4 space-y-4">
                        <h4 className="text-sm font-semibold text-gold flex items-center gap-1.5">
                          <RotateCcw className="w-4 h-4" /> Return Trip Details
                        </h4>
                        <DateTimePicker
                          dateLabel="Return Date"
                          timeLabel="Return Time"
                          date={form.returnDate}
                          time={form.returnTime}
                          onDateChange={(v) => updateField('returnDate', v)}
                          onTimeChange={(v) => updateField('returnTime', v)}
                          minDate={form.date}
                          dateError={fieldErrors.returnDate}
                          timeError={fieldErrors.returnTime}
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Return Flight Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={form.returnFlightNumber}
                            onChange={(e) => updateField('returnFlightNumber', e.target.value.toUpperCase())}
                            placeholder="e.g. NZ123"
                            maxLength={8}
                            className={cn(
                              'w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold uppercase',
                              fieldErrors.returnFlightNumber ? 'border-red-300 bg-red-50/30' : 'border-gray-300'
                            )}
                            data-testid="return-flight-input"
                          />
                          {fieldErrors.returnFlightNumber && (
                            <p className="mt-1 text-xs text-red-500">{fieldErrors.returnFlightNumber}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Price Display */}
                {priceLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-gold" />
                    Calculating your price...
                  </div>
                )}
                {pricing && !priceLoading && (
                  <PriceBreakdown pricing={pricing} bookReturn={!!hasReturnDetails} />
                )}

                {/* Continue Button */}
                <button
                  onClick={() => goToStep(1)}
                  disabled={!form.pickupAddress || !form.dropoffAddress}
                  className={cn(
                    'w-full h-14 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md',
                    form.pickupAddress && form.dropoffAddress && pricing
                      ? 'bg-gold hover:bg-yellow-500 text-black hover:shadow-gold/30 hover:scale-[1.01]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  )}
                  data-testid="step0-continue"
                >
                  {pricing
                    ? <><span>Continue</span> <ArrowRight className="w-5 h-5" /></>
                    : <span>Enter addresses above to see your price</span>
                  }
                </button>
              </motion.div>
            )}

            {/* ────────────────────────────────────────────────
                STEP 1: Your Details
               ──────────────────────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="p-6 sm:p-8 space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="John Smith"
                    className={cn(
                      'w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold',
                      fieldErrors.name ? 'border-red-300 bg-red-50/30' : 'border-gray-300'
                    )}
                    data-testid="name-input"
                  />
                  {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="john@example.com"
                    className={cn(
                      'w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold',
                      fieldErrors.email ? 'border-red-300 bg-red-50/30' : 'border-gray-300'
                    )}
                    data-testid="email-input"
                  />
                  {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+64 21 123 4567"
                    className={cn(
                      'w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold',
                      fieldErrors.phone ? 'border-red-300 bg-red-50/30' : 'border-gray-300'
                    )}
                    data-testid="phone-input"
                  />
                  {fieldErrors.phone && <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Special Requests <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Child seat required, meet at arrivals, etc."
                    rows={3}
                    maxLength={1000}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/40 focus:border-gold resize-none"
                    data-testid="notes-input"
                  />
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                  <button
                    onClick={() => goToStep(0)}
                    className="flex-1 h-12 border-2 border-gray-200 text-gray-600 hover:border-gray-300 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                    data-testid="step1-back"
                  >
                    <ArrowLeft className="w-5 h-5" /> Back
                  </button>
                  <button
                    onClick={() => goToStep(2)}
                    className="flex-1 h-12 bg-gold hover:bg-yellow-500 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-gold/30"
                    data-testid="step1-continue"
                  >
                    Review Booking <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ───��────────────────────────────────────────────
                STEP 2: Confirm & Pay
               ─���────────────────────────���───────────────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="p-6 sm:p-8 space-y-5"
              >
                <h2 className="text-lg font-semibold text-gray-900">Review Your Booking</h2>

                <BookingSummary form={form} />

                <PriceBreakdown
                  pricing={pricing}
                  bookReturn={!!hasReturnDetails}
                  compact
                />

                {/* Navigation */}
                <div className="flex gap-3">
                  <button
                    onClick={() => goToStep(1)}
                    className="flex-1 h-12 border-2 border-gray-200 text-gray-600 hover:border-gray-300 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                    data-testid="step2-back"
                  >
                    <ArrowLeft className="w-5 h-5" /> Back
                  </button>
                  <button
                    onClick={submitBooking}
                    disabled={submitting}
                    className={cn(
                      'flex-1 h-12 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md',
                      submitting
                        ? 'bg-gray-300 text-gray-500 cursor-wait'
                        : 'bg-gold hover:bg-yellow-500 text-black hover:shadow-gold/30'
                    )}
                    data-testid="pay-button"
                  >
                    {submitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                    ) : (
                      <><CheckCircle className="w-5 h-5" /> Pay ${pricing?.totalPrice?.toFixed(2)} NZD</>
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Secure payment via Stripe. Your details are encrypted.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Trust Signals */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 sm:gap-6 text-xs text-gray-500">
          {[
            { icon: Shield, text: 'Fixed prices — no surprises' },
            { icon: Plane, text: 'Flight tracking included' },
            { icon: ClockIcon, text: 'Free cancellation 24h' },
            { icon: CheckCircle, text: '10,000+ happy customers' },
          ].map(({ icon: TrustIcon, text }) => (
            <span key={text} className="flex items-center gap-1.5">
              <TrustIcon className="w-3.5 h-3.5 text-gold" />{text}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
