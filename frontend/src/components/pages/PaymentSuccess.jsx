import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Calendar, MapPin, Clock, Users, ArrowRight, Phone, Mail, Loader2 } from 'lucide-react'
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
      <div className="section-padding text-center">
        <div className="container-max max-w-lg">
          <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Confirming your payment&hellip;</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="section-padding text-center">
        <div className="container-max max-w-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
          <p className="text-gray-500 mb-6">{error || 'Booking not found.'}</p>
          <p className="text-gray-500 mb-8">
            Don&apos;t worry &mdash; if your payment was processed, you&apos;ll receive a confirmation email shortly.
            Contact us if you need assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:+6421880793" className="btn-primary">
              <Phone className="w-4 h-4 mr-2" /> Call Us
            </a>
            <Link to="/" className="btn-outline">Back to Home</Link>
          </div>
        </div>
      </div>
    )
  }

  const data = booking.data || booking

  return (
    <div className="section-padding">
      <div className="container-max max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-500">
            Your reference number is{' '}
            <span className="font-mono font-bold text-gold text-lg">
              {data.reference || data.id}
            </span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 text-lg">Trip Details</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Pickup</p>
                  <p className="text-sm text-gray-700">{data.pickup_address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Drop-off</p>
                  <p className="text-sm text-gray-700">{data.dropoff_address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gold mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Date</p>
                  <p className="text-sm text-gray-700">{data.pickup_date}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gold mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Time</p>
                  <p className="text-sm text-gray-700">{data.pickup_time}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gold mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Passengers</p>
                  <p className="text-sm text-gray-700">{data.passengers}</p>
                </div>
              </div>
            </div>

            {data.total_price && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total Paid</span>
                  <span className="text-xl font-bold text-gold">
                    ${Number(data.total_price).toFixed(2)} NZD
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              A confirmation email has been sent to <strong>{data.email}</strong>.
              Your driver will contact you before the pickup.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/book-now" className="btn-primary">
              Book Another Ride <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link to="/" className="btn-outline">Back to Home</Link>
          </div>

          <p className="text-sm text-gray-400">
            Questions? Call{' '}
            <a href="tel:+6421880793" className="text-gold hover:underline">021 880 793</a>
            {' '}or email{' '}
            <a href="mailto:info@bookaride.co.nz" className="text-gold hover:underline">info@bookaride.co.nz</a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
