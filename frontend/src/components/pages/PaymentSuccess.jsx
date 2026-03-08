import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle, Calendar, MapPin, Clock, Users, ArrowRight,
  Phone, Mail, Loader2, Hash, AlertCircle,
} from 'lucide-react'
import api from '../../lib/api'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const sessionId = searchParams.get('session_id')
  const bookingId = searchParams.get('booking_id')

  useEffect(() => {
    if (!sessionId && !bookingId) {
      setError('No booking reference found')
      setLoading(false)
      return
    }

    const params = sessionId
      ? `session_id=${sessionId}`
      : `booking_id=${bookingId}`

    api.get(`/payment/success?${params}`)
      .then(res => {
        setBooking(res.data.booking)
        setLoading(false)
      })
      .catch(() => {
        setError('Could not retrieve booking details')
        setLoading(false)
      })
  }, [sessionId, bookingId])

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-88px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Confirming your payment…</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-[calc(100vh-88px)] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h1>
          <p className="text-gray-500 mb-3">{error || 'Booking not found.'}</p>
          <p className="text-gray-400 text-sm mb-8">
            Don't worry — if your payment was processed your booking is confirmed.
            Call us and quote your booking reference.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:+6421880793" className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-yellow-500 text-black font-bold px-6 py-3 rounded-xl transition-all">
              <Phone className="w-4 h-4" /> 021 880 793
            </a>
            <Link to="/" className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 hover:border-gray-300 font-semibold px-6 py-3 rounded-xl transition-all">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const b = booking

  return (
    <div className="min-h-[calc(100vh-88px)] bg-gradient-to-br from-green-50 to-white py-12">
      <div className="container-max px-4 sm:px-6 max-w-2xl">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-500 text-lg">Your transfer is locked in. See you on the day.</p>
        </motion.div>

        {/* Reference badge */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gold/30 p-6 text-center mb-6">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Booking Reference</p>
          <p className="text-gold text-4xl font-mono font-bold tracking-wider">
            #{b.referenceNumber || b.id?.slice(-6).toUpperCase()}
          </p>
          <p className="text-gray-500 text-sm mt-2">Save this — you'll need it if you call us</p>
        </motion.div>

        {/* Trip details */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-gray-900 text-lg mb-5">Trip Details</h2>
          <div className="space-y-4">
            <Detail icon={MapPin} label="Pickup" value={b.pickupAddress} />
            <Detail icon={MapPin} label="Drop-off" value={b.dropoffAddress} />
            <Detail icon={Calendar} label="Date" value={b.date} />
            <Detail icon={Clock} label="Time" value={b.time} />
            <Detail icon={Users} label="Passengers" value={b.passengers} />
            {b.bookReturn && b.returnDate && (
              <Detail icon={Calendar} label="Return" value={`${b.returnDate} at ${b.returnTime}`} />
            )}
            {b.departureFlightNumber && <Detail icon={Hash} label="Flight" value={b.departureFlightNumber} />}
          </div>

          {b.totalPrice && (
            <div className="mt-5 pt-5 border-t border-gray-100 flex justify-between items-center">
              <span className="font-semibold text-gray-700">Total Paid</span>
              <span className="text-2xl font-bold text-gold">${Number(b.totalPrice).toFixed(2)} NZD</span>
            </div>
          )}
        </motion.div>

        {/* Confirmation note */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-800">
          <strong>✓ Confirmation email sent to {b.email}</strong>
          <p className="mt-1 text-green-700">Your driver will contact you before pickup. We monitor all flights automatically.</p>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row gap-3">
          <Link to="/book-now" className="flex-1 inline-flex items-center justify-center gap-2 bg-gold hover:bg-yellow-500 text-black font-bold px-6 py-3.5 rounded-xl transition-all shadow-md hover:shadow-gold/30">
            Book Another <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/" className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-6 py-3.5 rounded-xl transition-all">
            Back to Home
          </Link>
        </motion.div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Questions?{' '}
          <a href="tel:+6421880793" className="text-gold hover:underline font-medium">021 880 793</a>
          {' '}·{' '}
          <a href="mailto:info@bookaride.co.nz" className="text-gold hover:underline">info@bookaride.co.nz</a>
        </p>
      </div>
    </div>
  )
}

function Detail({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center mt-0.5">
        <Icon className="w-4 h-4 text-gold" />
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 font-medium">{value}</p>
      </div>
    </div>
  )
}
