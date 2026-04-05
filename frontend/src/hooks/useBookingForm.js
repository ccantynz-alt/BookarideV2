/**
 * useBookingForm — Central state management for the booking wizard.
 *
 * Manages form state, validation, price calculation, and submission.
 * Single source of truth for the entire booking flow.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../lib/api'

// ── Initial form state ──────────────────────────────────────────

const INITIAL_FORM = {
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
}

// Fields that trigger a price recalculation when changed
const PRICE_FIELDS = [
  'pickupAddress', 'dropoffAddress', 'pickupAddresses',
  'passengers', 'vipAirportPickup', 'oversizedLuggage', 'bookReturn',
]

// ── Validation rules ────────────────────────────────────────────

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const PHONE_RE = /^[\d\s+\-().]{7,20}$/

function validateStep0(form, pricing) {
  const errors = {}
  if (!form.pickupAddress || form.pickupAddress.length < 5)
    errors.pickupAddress = 'Pickup address is required'
  if (!form.dropoffAddress || form.dropoffAddress.length < 5)
    errors.dropoffAddress = 'Drop-off address is required'
  if (!form.date)
    errors.date = 'Date is required'
  if (!form.time)
    errors.time = 'Time is required'
  if (!pricing)
    errors.pricing = 'Price must be calculated before continuing'

  // Validate date is not in the past
  if (form.date) {
    const today = new Date().toISOString().split('T')[0]
    if (form.date < today) errors.date = 'Date cannot be in the past'
  }

  // Return trip validation
  if (form.bookReturn) {
    if (!form.returnDate) errors.returnDate = 'Return date is required'
    if (!form.returnTime) errors.returnTime = 'Return time is required'
    if (!form.returnFlightNumber) errors.returnFlightNumber = 'Return flight number is required'
    if (form.returnDate && form.date && form.returnDate < form.date)
      errors.returnDate = 'Return date cannot be before outbound date'
  }

  return errors
}

function validateStep1(form) {
  const errors = {}
  if (!form.name || form.name.trim().length < 2)
    errors.name = 'Full name is required'
  if (!form.email || !EMAIL_RE.test(form.email))
    errors.email = 'Valid email address is required'
  if (!form.phone || !PHONE_RE.test(form.phone))
    errors.phone = 'Valid phone number is required'
  return errors
}

// ── Hook ────────────────────────────────────────────────────────

export default function useBookingForm() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [step, setStep] = useState(0)
  const [pricing, setPricing] = useState(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const calcDebounce = useRef(null)
  const idempotencyKey = useRef(crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))

  // ── Load returning customer details ───────────────────────
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bookaride_customer') || 'null')
      if (saved?.name) {
        setForm((prev) => ({
          ...prev,
          name: saved.name,
          email: saved.email || '',
          phone: saved.phone || '',
        }))
      }
    } catch { /* ignore corrupt localStorage */ }
  }, [])

  // ── Update a single field ─────────────────────────────────
  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear field-specific error when user starts typing
    setFieldErrors((prev) => {
      if (prev[field]) {
        const next = { ...prev }
        delete next[field]
        return next
      }
      return prev
    })
    setError('')
    // Clear pricing when price-affecting fields change
    if (PRICE_FIELDS.includes(field)) {
      setPricing(null)
    }
  }, [])

  // ── Additional pickups management ─────────────────────────
  const addPickup = useCallback(() => {
    setForm((prev) => {
      if (prev.pickupAddresses.length >= 3) return prev
      return { ...prev, pickupAddresses: [...prev.pickupAddresses, ''] }
    })
    setPricing(null)
  }, [])

  const updatePickup = useCallback((index, value) => {
    setForm((prev) => {
      const updated = [...prev.pickupAddresses]
      updated[index] = value
      return { ...prev, pickupAddresses: updated }
    })
    setPricing(null)
  }, [])

  const removePickup = useCallback((index) => {
    setForm((prev) => ({
      ...prev,
      pickupAddresses: prev.pickupAddresses.filter((_, i) => i !== index),
    }))
    setPricing(null)
  }, [])

  // ── Price calculation ─────────────────────────────────────
  const calculatePrice = useCallback(async (f = form) => {
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
  }, [form])

  // Auto-calculate with debounce when relevant fields change
  useEffect(() => {
    if (!form.pickupAddress || !form.dropoffAddress) return
    if (calcDebounce.current) clearTimeout(calcDebounce.current)
    calcDebounce.current = setTimeout(() => calculatePrice(form), 600)
    return () => clearTimeout(calcDebounce.current)
  }, [
    form.pickupAddress, form.dropoffAddress, form.pickupAddresses,
    form.passengers, form.vipAirportPickup, form.oversizedLuggage,
    form.bookReturn, form.returnDate, form.returnTime,
  ])

  // ── Step navigation ───────────────────────────────────────
  const goToStep = useCallback((targetStep) => {
    // Validate current step before moving forward
    if (targetStep > step) {
      if (step === 0) {
        const errors = validateStep0(form, pricing)
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors)
          setError('Please fix the highlighted fields to continue')
          return false
        }
      }
      if (step === 1) {
        const errors = validateStep1(form)
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors)
          setError('Please fix the highlighted fields to continue')
          return false
        }
      }
    }
    setFieldErrors({})
    setError('')
    setStep(targetStep)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return true
  }, [step, form, pricing])

  // ── Submit booking ────────────────────────────────────────
  const submitBooking = useCallback(async () => {
    // Final validation
    const step1Errors = validateStep1(form)
    if (Object.keys(step1Errors).length > 0) {
      setFieldErrors(step1Errors)
      setError('Please fix the highlighted fields')
      return null
    }

    if (!pricing) {
      setError('Price must be calculated before submitting')
      return null
    }

    setError('')
    setSubmitting(true)

    try {
      // Save customer details for returning visitors
      localStorage.setItem('bookaride_customer', JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
      }))

      // Create booking with idempotency key
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
      }, {
        headers: { 'X-Idempotency-Key': idempotencyKey.current },
      })

      // Create Stripe checkout session
      const { data: checkout } = await api.post('/payment/create-checkout', {
        booking_id: booking.id,
      })

      if (checkout.url) {
        window.location.href = checkout.url
        return booking
      }

      // Fallback — should not reach here normally
      return booking
    } catch (err) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        setError(detail)
      } else if (Array.isArray(detail)) {
        // Pydantic validation errors
        const messages = detail.map((d) => d.msg || d.message || JSON.stringify(d))
        setError(messages.join('. '))
      } else {
        setError('Failed to create booking — please try again')
      }
      // Generate new idempotency key for retry
      idempotencyKey.current = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
      return null
    } finally {
      setSubmitting(false)
    }
  }, [form, pricing])

  // ── Return the public API ─────────────────────────────────
  return {
    // State
    form,
    step,
    pricing,
    priceLoading,
    submitting,
    error,
    fieldErrors,

    // Actions
    updateField,
    addPickup,
    updatePickup,
    removePickup,
    calculatePrice,
    goToStep,
    submitBooking,
    setError,
  }
}
