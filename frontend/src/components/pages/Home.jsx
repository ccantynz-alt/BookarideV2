import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Plane, MapPin, Star, Check, Shield, Clock, Award, Users, Calendar, Phone } from 'lucide-react'

const SERVICES = [
  { icon: Plane, title: 'Airport Shuttle', description: 'Shared and private shuttle services to Auckland, Hamilton & Whangarei airports.', features: ['Door-to-door pickup', 'Flight monitoring', 'All hours covered'] },
  { icon: MapPin, title: 'Private Transfer', description: 'Exclusive vehicle hire for your group. Point-to-point, your way.', features: ['Private vehicle', 'Flexible scheduling', 'Up to 11 passengers'] },
  { icon: Award, title: 'Hobbiton Tours', description: 'Day transfers from Auckland to the Hobbiton Movie Set in Matamata.', features: ['175km scenic drive', 'Return trips available', 'Timed for tours'] },
  { icon: Calendar, title: 'Cruise Transfers', description: "Dedicated transfers to and from Auckland's cruise terminal.", features: ['All cruise lines', 'Luggage friendly', 'Meet & greet'] },
]

const TESTIMONIALS = [
  { id: 1, name: 'Sarah M.', role: 'Business Traveller', rating: 5, content: 'Absolutely seamless experience from start to finish. Driver was early, vehicle was spotless, and the booking was so easy. Will never use anyone else for airport transfers.' },
  { id: 2, name: 'Michael T.', role: 'International Visitor', rating: 5, content: "Best airport transfer I've had in NZ. Professional, on-time, and great value. The flight tracking meant my driver knew my flight was delayed before I did!" },
  { id: 3, name: 'The Johnson Family', role: 'Regular Customers', rating: 5, content: 'We use BookARide every time we travel. The family shuttle is perfect — comfortable, affordable, and the kids love it. Highly recommended for families.' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Book Online', description: 'Enter your trip details and get an instant price. Book in under 60 seconds.' },
  { step: '02', title: 'Instant Confirmation', description: 'Receive email & SMS confirmation with your booking reference immediately.' },
  { step: '03', title: 'We Track Your Flight', description: 'We monitor your flight and adjust pickup times automatically — no extra charge.' },
  { step: '04', title: 'Enjoy Your Ride', description: 'Your driver meets you at the door. Sit back and arrive relaxed.' },
]

const WHY_CHOOSE = [
  { title: 'Instant Online Booking', desc: 'Book in 60 seconds with live price calculator. No phone calls or email quotes needed.' },
  { title: 'Triple Confirmations', desc: 'Instant email, SMS, and Google Calendar entry for every booking.' },
  { title: 'VIP Airport Service', desc: 'Premium airport pickup with VIP parking close to terminal doors.' },
  { title: 'Secure Online Payments', desc: 'Fast, secure checkout with Stripe. Pay confidently every time.' },
  { title: 'One-Click Return Trips', desc: 'Book your return journey in a single booking at the same time.' },
  { title: 'Specialist Routes', desc: 'Dedicated Hobbiton tours and cruise ship transfers — we know these routes inside out.' },
  { title: 'Oversized Luggage Welcome', desc: 'Skis, bikes, surfboards, golf clubs — we handle all your gear.' },
  { title: 'Fixed Transparent Pricing', desc: 'See your exact price before booking. No surge pricing, no hidden fees.' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } }),
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-20px)] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1522199873717-bc67b1a5e32b?auto=format&fit=crop&w=1920&q=80"
            alt="Professional traveller at Auckland airport"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        <div className="container-max px-4 sm:px-6 lg:px-8 relative z-10 py-32 sm:py-40">
          <div className="max-w-3xl">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span className="text-white/90 font-medium text-sm">5-Star Rated Airport Transfers</span>
              </div>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              custom={1}
              variants={fadeUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight"
            >
              Premium Airport
              <br />
              <span className="text-gold">Transfers</span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={2}
              variants={fadeUp}
              className="text-xl sm:text-2xl text-white/80 mb-10 leading-relaxed max-w-xl"
            >
              Arrive in comfort, style, and safety. Auckland's most trusted transfer service.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              custom={3}
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <Link
                to="/book-now"
                className="inline-flex items-center justify-center gap-3 h-14 bg-gold hover:bg-gold-500 text-white font-semibold text-lg px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
              >
                Book Your Ride
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center justify-center h-14 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold text-lg px-8 rounded-xl border border-white/20 transition-all duration-200"
              >
                View Services
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              custom={4}
              variants={fadeUp}
              className="flex flex-wrap items-center gap-6 text-white/70 text-sm"
            >
              {[
                { icon: Shield, label: 'Fully Insured' },
                { icon: Clock, label: '24/7 Service' },
                { icon: Users, label: '10,000+ Happy Clients' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-gold" />
                  <span>{label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ───────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="container-max px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-sm text-gray-500">
            {['Professional Drivers', 'Premium Vehicles', 'Fixed Rates', 'Flight Tracking', 'Door-to-Door'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-gold" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-gold text-sm font-semibold uppercase tracking-wider">What We Offer</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 mb-4">Our Services</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Whatever your transportation needs, we've got you covered</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((service, i) => (
              <motion.div
                key={service.title}
                initial="hidden"
                whileInView="visible"
                custom={i}
                variants={fadeUp}
                viewport={{ once: true, margin: '-50px' }}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:border-gold/30 transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold group-hover:shadow-lg transition-all duration-300">
                  <service.icon className="w-7 h-7 text-gold group-hover:text-white transition-colors duration-200" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-500 mb-6 text-sm leading-relaxed">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-gold mr-2.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ───────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-gold text-sm font-semibold uppercase tracking-wider">The BookARide Difference</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 mb-4">Why Choose Us?</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Best value airport transfers with modern convenience</p>
          </div>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {WHY_CHOOSE.map(({ title, desc }, i) => (
              <motion.div
                key={title}
                initial="hidden"
                whileInView="visible"
                custom={i}
                variants={fadeUp}
                viewport={{ once: true, margin: '-30px' }}
                className="flex items-start gap-4 p-5 rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="shrink-0 w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                  <Check className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOBBITON FEATURE ────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-10 lg:p-14 flex flex-col justify-center">
                <span className="inline-block bg-gold/10 text-gold text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wide mb-5 w-fit">
                  Popular Destination
                </span>
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Hobbiton Movie Set Transfers</h3>
                <p className="text-gray-500 mb-8 text-lg leading-relaxed">
                  Experience the magic of Middle-earth with our premium transfer service from Auckland to Hobbiton in Matamata.
                </p>
                <ul className="space-y-3 mb-8">
                  {['175km scenic journey through Waikato', 'Perfect timing for your Hobbiton tour', 'Return trips available'].map((item) => (
                    <li key={item} className="flex items-center text-gray-600">
                      <Check className="w-5 h-5 text-gold mr-3 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/hobbiton-transfers" className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-500 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200">
                    Learn More <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/book-now" className="inline-flex items-center justify-center border border-gold text-gold hover:bg-gold hover:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200">
                    Book Now
                  </Link>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gold/5 to-gold/10 p-10 lg:p-14 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Award className="w-12 h-12 text-gold" />
                  </div>
                  <p className="text-gray-900 font-bold text-2xl mb-2">Get Instant Quote</p>
                  <p className="text-gray-500 text-sm">Live pricing — book online in 60 seconds</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-gold text-sm font-semibold uppercase tracking-wider">Simple Process</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 mb-4">How It Works</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Booking a ride is quick and easy</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial="hidden"
                whileInView="visible"
                custom={i}
                variants={fadeUp}
                viewport={{ once: true, margin: '-50px' }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-gray-900 text-gold rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-sm">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-gold text-sm font-semibold uppercase tracking-wider">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 mb-4">What Our Customers Say</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Don't just take our word for it</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.id}
                initial="hidden"
                whileInView="visible"
                custom={i}
                variants={fadeUp}
                viewport={{ once: true, margin: '-50px' }}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
              >
                <div className="flex mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-gold fill-gold" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed text-[15px]">"{t.content}"</p>
                <div className="border-t border-gray-100 pt-4">
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section className="py-24 bg-gray-900">
        <div className="container-max px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={fadeUp}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Book Your Ride?</h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Get your instant price online and let us take care of your transportation needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/book-now"
                className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-500 text-white font-semibold px-10 py-4 rounded-xl text-lg transition-all duration-200 shadow-lg"
              >
                Book Now <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="tel:+6421880793"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-10 py-4 rounded-xl text-lg border border-white/20 transition-all duration-200"
              >
                <Phone className="w-5 h-5" /> Call Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
