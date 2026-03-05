import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react'

const FOOTER_LINKS = {
  'Quick Links': [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'About Us', path: '/about' },
    { label: 'Book Now', path: '/book-now' },
    { label: 'Contact', path: '/contact' },
  ],
  Services: [
    { label: 'Auckland Airport Shuttle', path: '/services' },
    { label: 'Private Transfers', path: '/services' },
    { label: 'Hobbiton Transfers', path: '/hobbiton-transfers' },
    { label: 'Cruise Transfers', path: '/cruise-transfers' },
    { label: 'Shared Shuttle', path: '/shared-shuttle' },
  ],
  Legal: [
    { label: 'Privacy Policy', path: '/privacy-policy' },
    { label: 'Terms & Conditions', path: '/terms-and-conditions' },
    { label: 'Website Usage', path: '/website-usage-policy' },
    { label: 'Drive With Us', path: '/drive-with-us' },
    { label: 'Travel Agents', path: '/travel-agents' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-gray-300 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-max px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          <div>
            <Link to="/" className="inline-block mb-5">
              <img src="/logo.png" alt="Book A Ride NZ" className="h-14 w-auto" style={{ filter: 'brightness(1.8) contrast(1.3) saturate(1.2) drop-shadow(0 2px 8px rgba(212,175,55,0.3))' }} />
            </Link>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Auckland's trusted airport transfer service. Door-to-door private and shared shuttle rides at the best prices.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Facebook, href: 'https://facebook.com/bookaridenz', label: 'Facebook' },
                { icon: Twitter, href: 'https://twitter.com/bookaridenz', label: 'Twitter' },
                { icon: Instagram, href: 'https://instagram.com/bookaridenz', label: 'Instagram' },
              ].map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="w-9 h-9 bg-white/10 hover:bg-gold/20 border border-white/10 hover:border-gold/40 rounded-lg flex items-center justify-center text-gray-400 hover:text-gold transition-all duration-200">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-gold font-semibold mb-4 text-sm uppercase tracking-wider">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.path + link.label}>
                    <Link to={link.path} className="text-sm text-gray-400 hover:text-gold transition-colors duration-200">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 mb-8">
          <div className="flex flex-wrap gap-6 text-sm">
            <a href="tel:+6421880793" className="flex items-center gap-2 text-gray-400 hover:text-gold transition-colors"><Phone className="w-4 h-4 text-gold" /> 021 880 793</a>
            <a href="mailto:info@bookaride.co.nz" className="flex items-center gap-2 text-gray-400 hover:text-gold transition-colors"><Mail className="w-4 h-4 text-gold" /> info@bookaride.co.nz</a>
            <span className="flex items-center gap-2 text-gray-400"><MapPin className="w-4 h-4 text-gold" /> Auckland, New Zealand</span>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} BookARide. All rights reserved.</p>
          <p>Auckland Airport Transfer Specialists</p>
        </div>
      </div>
    </footer>
  )
}
