import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import api from '../../lib/api'

// Generate a session token per component mount (Google uses this for billing)
function makeSessionToken() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

export default function AddressInput({ label, value, onChange, placeholder, icon: Icon = MapPin }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)
  const sessionRef = useRef(makeSessionToken())

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
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
    onChange('')  // clear selected until user picks from dropdown

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
      } catch {
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
    // New session token after selection (Google bills per session)
    sessionRef.current = makeSessionToken()
  }

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      )}
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder || 'Enter address...'}
          className={cn(
            'w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-sm',
            'focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold',
            'placeholder:text-gray-400 transition-colors'
          )}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={s.place_id || i}
              onClick={() => select(s)}
              className="px-4 py-3 text-sm cursor-pointer hover:bg-gold-50 flex items-start gap-2 border-b border-gray-50 last:border-0"
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
