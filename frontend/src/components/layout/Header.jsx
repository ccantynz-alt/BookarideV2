import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { cn } from '../../lib/cn'

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Services', path: '/services' },
  { label: 'Hobbiton', path: '/hobbiton-transfers' },
  { label: 'Cruise', path: '/cruise-transfers' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gray-900/90 border-b border-gold/20 shadow-lg">
      {/* Top gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />

      <nav className="container-max px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0 group">
            <img
              src="/logo.png"
              alt="Book A Ride NZ"
              className="h-14 w-auto transform group-hover:scale-105 transition-transform duration-200"
              style={{
                filter: 'brightness(1.8) contrast(1.3) saturate(1.2) drop-shadow(0 2px 12px rgba(212,175,55,0.4))',
              }}
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg group',
                  location.pathname === link.path
                    ? 'text-gold bg-gold/10'
                    : 'text-white/90 hover:text-gold hover:bg-white/5'
                )}
              >
                {link.label}
                <span className={cn(
                  'absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gold transition-all duration-300',
                  location.pathname === link.path ? 'w-3/4' : 'w-0 group-hover:w-3/4'
                )} />
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center">
            <Link
              to="/book-now"
              className="bg-gold hover:bg-yellow-500 text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-all duration-300 shadow-lg hover:shadow-gold/30 hover:scale-105"
            >
              Book a Ride
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-gold/30 hover:border-gold/50 text-gold transition-all duration-200"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-1 border-t border-gold/20 pt-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                  location.pathname === link.path
                    ? 'text-gold bg-gold/10 border-l-2 border-gold'
                    : 'text-white/90 hover:text-gold hover:bg-white/5'
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/book-now"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center bg-gold hover:bg-yellow-500 text-black font-semibold px-4 py-3 rounded-lg transition-all duration-300 shadow-lg mt-2"
            >
              Book a Ride
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
