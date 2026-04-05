import {
  MapPin, Calendar, Clock, Users, Plane, Star, Luggage, RotateCcw,
  User, Mail, Phone, MessageSquare,
} from 'lucide-react'

function formatTime12h(time24) {
  if (!time24) return ''
  const [h, m] = time24.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-NZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function SummaryRow({ icon: Icon, label, value, highlight }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${highlight ? 'text-gold' : 'text-gray-400'}`} />
      <div className="flex-1 min-w-0">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
        <p className="text-sm text-gray-800 font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

export default function BookingSummary({ form }) {
  return (
    <div className="space-y-4" data-testid="booking-summary">
      {/* Trip Details */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Trip Details</h3>
        <SummaryRow icon={MapPin} label="Pickup" value={form.pickupAddress} highlight />
        {form.pickupAddresses.filter(Boolean).map((addr, i) => (
          <SummaryRow key={i} icon={MapPin} label={`Stop ${i + 1}`} value={addr} />
        ))}
        <SummaryRow icon={MapPin} label="Drop-off" value={form.dropoffAddress} highlight />
        <SummaryRow icon={Calendar} label="Date" value={formatDate(form.date)} />
        <SummaryRow icon={Clock} label="Time" value={formatTime12h(form.time)} />
        <SummaryRow icon={Users} label="Passengers" value={form.passengers} />
        {form.departureFlightNumber && (
          <SummaryRow icon={Plane} label="Departure Flight" value={form.departureFlightNumber} />
        )}
        {form.arrivalFlightNumber && (
          <SummaryRow icon={Plane} label="Arrival Flight" value={form.arrivalFlightNumber} />
        )}
        {form.vipAirportPickup && (
          <SummaryRow icon={Star} label="VIP Pickup" value="Included" highlight />
        )}
        {form.oversizedLuggage && (
          <SummaryRow icon={Luggage} label="Large Luggage" value="Included" />
        )}
      </div>

      {/* Return Trip */}
      {form.bookReturn && form.returnDate && (
        <div className="bg-gold-50/50 rounded-xl p-4 space-y-1 border border-gold/20">
          <h3 className="text-xs font-semibold text-gold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Return Trip
          </h3>
          <SummaryRow icon={Calendar} label="Return Date" value={formatDate(form.returnDate)} />
          <SummaryRow icon={Clock} label="Return Time" value={formatTime12h(form.returnTime)} />
          <SummaryRow icon={Plane} label="Return Flight" value={form.returnFlightNumber} />
        </div>
      )}

      {/* Customer Details */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Details</h3>
        <SummaryRow icon={User} label="Name" value={form.name} />
        <SummaryRow icon={Mail} label="Email" value={form.email} />
        <SummaryRow icon={Phone} label="Phone" value={form.phone} />
        {form.notes && <SummaryRow icon={MessageSquare} label="Notes" value={form.notes} />}
      </div>
    </div>
  )
}
