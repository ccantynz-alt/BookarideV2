import { useRef } from 'react'
import { cn } from '../../lib/cn'
import { Calendar, Clock } from 'lucide-react'

// Generate time slots from 00:00 to 23:30 in 30-min intervals
// Display in 12-hour AM/PM format, store as 24-hour value
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h24 = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  const value = `${String(h24).padStart(2, '0')}:${m}`
  const period = h24 < 12 ? 'AM' : 'PM'
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24
  const label = `${h12}:${m} ${period}`
  return { value, label }
})

function formatDateDisplay(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-')
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTimeDisplay(timeStr) {
  if (!timeStr) return null
  const slot = TIME_SLOTS.find((t) => t.value === timeStr)
  return slot ? slot.label : timeStr
}

export default function DateTimePicker({
  dateLabel = 'Pickup Date',
  timeLabel = 'Pickup Time',
  date,
  time,
  onDateChange,
  onTimeChange,
  minDate,
}) {
  const dateRef = useRef(null)
  const timeRef = useRef(null)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Date button */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{dateLabel}</label>
        <div className="relative">
          <input
            ref={dateRef}
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            min={minDate || today}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            tabIndex={-1}
          />
          <button
            type="button"
            onClick={() => dateRef.current?.showPicker?.() || dateRef.current?.click()}
            className={cn(
              'w-full flex items-center gap-2 px-4 py-3 border rounded-lg text-sm font-medium transition-all text-left',
              date
                ? 'border-gold bg-gold-50 text-gold'
                : 'border-gray-300 text-gray-400 hover:border-gray-400'
            )}
          >
            <Calendar className="w-5 h-5 shrink-0" />
            {formatDateDisplay(date) || 'Select date'}
          </button>
        </div>
      </div>

      {/* Time button */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{timeLabel}</label>
        <div className="relative">
          <select
            ref={timeRef}
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            tabIndex={-1}
          >
            <option value="">Select time</option>
            {TIME_SLOTS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => timeRef.current?.click()}
            className={cn(
              'w-full flex items-center gap-2 px-4 py-3 border rounded-lg text-sm font-medium transition-all text-left',
              time
                ? 'border-gold bg-gold-50 text-gold'
                : 'border-gray-300 text-gray-400 hover:border-gray-400'
            )}
          >
            <Clock className="w-5 h-5 shrink-0" />
            {formatTimeDisplay(time) || 'Select time'}
          </button>
        </div>
      </div>
    </div>
  )
}
