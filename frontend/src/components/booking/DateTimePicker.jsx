import { useRef } from 'react'
import { cn } from '../../lib/cn'
import { Calendar, Clock, AlertCircle } from 'lucide-react'

// 30-minute slots, 00:00 to 23:30
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
  return date.toLocaleDateString('en-NZ', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
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
  dateError,
  timeError,
}) {
  const dateRef = useRef(null)
  const timeRef = useRef(null)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {dateLabel} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            ref={dateRef}
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            min={minDate || today}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            tabIndex={-1}
            data-testid={`date-input-${dateLabel.toLowerCase().replace(/\s+/g, '-')}`}
          />
          <button
            type="button"
            onClick={() => dateRef.current?.showPicker?.() || dateRef.current?.click()}
            className={cn(
              'w-full flex items-center gap-2 px-4 py-3 border rounded-lg text-sm font-medium transition-all text-left',
              dateError
                ? 'border-red-300 bg-red-50/30 text-red-600'
                : date
                  ? 'border-gold bg-gold-50 text-gold'
                  : 'border-gray-300 text-gray-400 hover:border-gray-400'
            )}
            data-testid={`date-button-${dateLabel.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Calendar className="w-5 h-5 shrink-0" />
            <span className="truncate">{formatDateDisplay(date) || 'Select date'}</span>
          </button>
        </div>
        {dateError && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {dateError}
          </p>
        )}
      </div>

      {/* Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {timeLabel} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            ref={timeRef}
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            tabIndex={-1}
            data-testid={`time-select-${timeLabel.toLowerCase().replace(/\s+/g, '-')}`}
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
              timeError
                ? 'border-red-300 bg-red-50/30 text-red-600'
                : time
                  ? 'border-gold bg-gold-50 text-gold'
                  : 'border-gray-300 text-gray-400 hover:border-gray-400'
            )}
            data-testid={`time-button-${timeLabel.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Clock className="w-5 h-5 shrink-0" />
            <span className="truncate">{formatTimeDisplay(time) || 'Select time'}</span>
          </button>
        </div>
        {timeError && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {timeError}
          </p>
        )}
      </div>
    </div>
  )
}
