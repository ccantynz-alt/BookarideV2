import { Link } from 'react-router-dom'
import { ArrowRight, Car, Ship, MapPin, Check } from 'lucide-react'

const SERVICES = [
  {
    icon: Car,
    title: 'Private Airport Transfer',
    desc: 'Direct door-to-door service in a private vehicle. Your driver tracks your flight and waits with a name board. Perfect for families, business travellers, and groups up to 11.',
    features: ['Door-to-door service', 'Flight tracking included', 'Meet & greet at arrivals', 'Child seats available', 'Free cancellation (24h)'],
    path: '/book-now',
  },
  {
    icon: Ship,
    title: 'Cruise Ship Transfers',
    desc: 'Reliable transfers to and from Auckland cruise terminal at Princes Wharf. All cruise lines, all ship sizes.',
    features: ['Princes Wharf terminal', 'All cruise lines welcome', 'Group rates available', 'Luggage assistance', 'Flexible scheduling'],
    path: '/book-now',
  },
  {
    icon: MapPin,
    title: 'Hobbiton Day Trip',
    desc: 'Return transfers from Auckland to the world-famous Hobbiton Movie Set in Matamata. A magical experience for the whole family.',
    features: ['Return transfers included', 'Auckland pickup', 'Direct to Matamata', 'Flexible departure times', 'Group rates available'],
    path: '/book-now',
  },
]

export default function Services() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white min-h-[calc(100vh-88px)]">
      <div className="container-max px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Our Services</h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Premium private transfers across Auckland. Get an instant online quote — no obligation.
          </p>
        </div>

        <div className="space-y-8 max-w-4xl mx-auto">
          {SERVICES.map((s) => (
            <div key={s.title} className="bg-white rounded-2xl border-2 border-gray-100 hover:border-gold/40 hover:shadow-xl transition-all duration-300 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <s.icon className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{s.title}</h2>
                  <p className="text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>

              <ul className="grid sm:grid-cols-2 gap-2.5 mb-8">
                {s.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-gold shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to={s.path}
                className="inline-flex items-center gap-2 bg-gold hover:bg-yellow-500 text-black font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-gold/30 hover:scale-105 text-sm"
              >
                Get Instant Quote <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-gold/30 px-10 py-10 max-w-2xl">
            <h3 className="text-2xl font-bold text-white mb-3">Not sure which service you need?</h3>
            <p className="text-gray-400 mb-6">Our booking form calculates your price instantly based on your route. Just enter your addresses and we'll do the rest.</p>
            <Link
              to="/book-now"
              className="inline-flex items-center gap-2 bg-gold hover:bg-yellow-500 text-black font-bold px-10 py-4 rounded-xl transition-all duration-300 shadow-lg hover:scale-105"
            >
              Book Now — Get Instant Price <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
