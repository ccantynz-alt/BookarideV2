import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plane,
  Shield,
  Clock,
  DollarSign,
  Star,
  Users,
  MapPin,
  ArrowRight,
  CheckCircle,
  Phone,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Shield,
    title: 'Safe & Reliable',
    desc: 'Licensed, insured drivers with professional vehicles. Track your ride in real time.',
  },
  {
    icon: Clock,
    title: 'On-Time Guarantee',
    desc: 'We monitor your flight. If it\'s delayed, we adjust. No extra charge.',
  },
  {
    icon: DollarSign,
    title: 'Best Price Promise',
    desc: 'Fixed prices, no surge. Pay online or on arrival. Afterpay available.',
  },
  {
    icon: Users,
    title: 'Door to Door',
    desc: 'Picked up from your door, dropped at the terminal. No bus stops, no waiting.',
  },
]

const SERVICES = [
  {
    title: 'Private Airport Transfer',
    desc: 'Direct door-to-door service in a private vehicle. Perfect for families and groups.',
    path: '/services',
    price: 'From $55',
  },
  {
    title: 'Shared Shuttle',
    desc: 'Share the ride, share the cost. Daily departures from Auckland CBD to the airport.',
    path: '/shared-shuttle',
    price: 'From $25pp',
  },
  {
    title: 'Cruise Ship Transfers',
    desc: 'Auckland cruise terminal pickups and drop-offs. All cruise lines welcome.',
    path: '/cruise-transfers',
    price: 'From $65',
  },
  {
    title: 'Hobbiton Transfers',
    desc: 'Day trips to the Hobbiton Movie Set from Auckland. Return transfers included.',
    path: '/hobbiton-transfers',
    price: 'From $180',
  },
]

const STATS = [
  { value: '15,000+', label: 'Happy Customers' },
  { value: '4.9', label: 'Google Rating', icon: Star },
  { value: '24/7', label: 'Service Available' },
  { value: '100%', label: 'On-Time Rate' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
}

export default function Home() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
        {/* Decorative gold accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-400 via-gold to-gold-600" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.08),transparent_60%)]" />

        <div className="container-max px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36 relative">
          <div className="max-w-3xl">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-6">
                <Plane className="w-4 h-4" />
                Auckland Airport Transfers
              </span>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              Your Ride to the Airport,{' '}
              <span className="text-gold">Sorted.</span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
              className="text-lg sm:text-xl text-gray-300 max-w-2xl mb-10 leading-relaxed"
            >
              Door-to-door private transfers and shared shuttles across Auckland.
              Fixed prices, flight tracking, and real-time driver updates.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
              className="flex flex-wrap gap-4"
            >
              <Link to="/book-now" className="btn-primary text-base px-8 py-4">
                Book Your Transfer
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link to="/services" className="btn-secondary text-base px-8 py-4 border-white/20 text-white hover:bg-white/10 hover:text-white">
                View Services
              </Link>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={4}
              className="flex flex-wrap gap-6 mt-12 text-sm text-gray-400"
            >
              {['Flight monitoring', 'Fixed prices', 'Meet & greet', 'Free cancellation'].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-gold" />
                  {item}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────── */}
      <section className="bg-gold">
        <div className="container-max px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-bold text-white flex items-center justify-center gap-1">
                  {stat.icon && <stat.icon className="w-6 h-6 fill-white" />}
                  {stat.value}
                </div>
                <div className="text-sm text-white/80 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose BookARide
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              We&apos;re not a rideshare app. We&apos;re a dedicated airport transfer service
              built for reliability and comfort.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={fadeUp}
                custom={i}
                className="p-6 rounded-2xl bg-gray-50 hover:bg-gold-50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <f.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────── */}
      <section className="section-padding bg-gray-50">
        <div className="container-max">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              From budget-friendly shared shuttles to premium private transfers.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {SERVICES.map((s, i) => (
              <motion.div
                key={s.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={fadeUp}
                custom={i}
              >
                <Link
                  to={s.path}
                  className="block p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 hover:border-gold/40 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-gold transition-colors">
                      {s.title}
                    </h3>
                    <span className="text-sm font-semibold text-gold bg-gold-50 px-3 py-1 rounded-full">
                      {s.price}
                    </span>
                  </div>
                  <p className="text-gray-500 mb-4">{s.desc}</p>
                  <span className="inline-flex items-center text-sm font-medium text-gold">
                    Learn more <ArrowRight className="w-4 h-4 ml-1" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular routes ───────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Popular Routes
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'North Shore to Airport',
              'Auckland CBD to Airport',
              'Hibiscus Coast to Airport',
              'Whangaparaoa to Airport',
              'Orewa to Airport',
              'Takapuna to Airport',
              'Devonport to Airport',
              'Browns Bay to Airport',
              'Howick to Airport',
            ].map((route) => (
              <Link
                key={route}
                to={`/routes/${route.toLowerCase().replace(/\s+/g, '-')}`}
                className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gold-50 transition-colors group"
              >
                <MapPin className="w-5 h-5 text-gold shrink-0" />
                <span className="text-gray-700 group-hover:text-gold transition-colors font-medium">
                  {route}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gold ml-auto transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-gray-900 via-gray-950 to-gray-900 text-white">
        <div className="container-max section-padding text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Book Your <span className="text-gold">Airport Transfer</span>?
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-8">
            Book online in 60 seconds. Pay securely. Get picked up from your door.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/book-now" className="btn-primary text-base px-8 py-4">
              Book Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <a
              href="tel:+6421880793"
              className="btn-secondary text-base px-8 py-4 border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call Us
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
