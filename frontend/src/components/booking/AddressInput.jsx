import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/cn'
import api from '../../lib/api'

function makeSessionToken() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

export default function AddressInput({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon = MapPin,
  error,
  required,
}) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const sessionRef = useRef(makeSessionToken())

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Sync external value changes
  useEffect(() => {
    if (value && value !== query) setQuery(value)
  }, [value])

  function handleInput(e) {
    const val = e.target.value
    setQuery(val)
    onChange('') // clear selected value until user picks from dropdown

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (val.length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/places/autocomplete', {
          params: { input: val, sessiontoken: sessionRef.current },
        })
        setSuggestions(data.predictions || [])
        setOpen(true)
      } catch (err) {
        console.error('[AddressInput] autocomplete error:', err?.response?.status)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  function select(suggestion) {
    const desc = suggestion.description
    setQuery(desc)
    onChange(desc)
    setOpen(false)
    setSuggestions([])
    sessionRef.current = makeSessionToken()
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const hasError = !!error
  const isSelected = !!value

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <Icon className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors',
          hasError ? 'text-red-400' : isSelected ? 'text-gold' : 'text-gray-400'
        )} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => { setFocused(true); if (suggestions.length > 0) setOpen(true) }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Enter address...'}
          className={cn(
            'w-full pl-10 pr-10 py-3 border rounded-lg text-sm transition-all duration-200',
            'placeholder:text-gray-400',
            hasError
              ? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400 bg-red-50/30'
              : isSelected
                ? 'border-gold/50 bg-gold-50/30 focus:ring-2 focus:ring-gold/30 focus:border-gold'
                : 'border-gray-300 focus:ring-2 focus:ring-gold/40 focus:border-gold'
          )}
          autoComplete="off"
          data-testid={`address-input-${(label || '').toLowerCase().replace(/\s+/g, '-')}`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold animate-spin" />
        )}
        {hasError && !loading && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          {error}
        </p>
      )}

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <ul
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.place_id || i}
              onClick={() => select(s)}
              role="option"
              className="px-4 py-3 text-sm cursor-pointer hover:bg-gold-50 flex items-start gap-2 border-b border-gray-50 last:border-0 transition-colors"
            >
              <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <span className="text-gray-700">{s.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
