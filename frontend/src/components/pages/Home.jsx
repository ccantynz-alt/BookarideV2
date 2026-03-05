import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Plane, MapPin, Star, Check, Shield, Clock, Award, Users, DollarSign, Calendar } from 'lucide-react'

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
  { step: '1', title: 'Book Online', description: 'Enter your trip details and get an instant price. Book in under 60 seconds.' },
  { step: '2', title: 'Instant Confirmation', description: 'Receive email & SMS confirmation with your booking reference immediately.' },
  { step: '3', title: 'We Track Your Flight', description: 'We monitor your flight and adjust pickup times automatically — no extra charge.' },
  { step: '4', title: 'Enjoy Your Ride', description: 'Your driver meets you at the door. Sit back and arrive relaxed.' },
]

const WHY_CHOOSE = [
  { title: 'Instant Online Booking', desc: 'Book in 60 seconds with live price calculator. No phone calls or email quotes needed.' },
  { title: 'Triple Confirmations', desc: 'Instant email, SMS, and Google Calendar entry for every booking.' },
  { title: 'VIP Airport Service', desc: 'Premium airport pickup with VIP parking close to terminal doors.' },
  { title: 'Secure Online Payments', desc: 'Fast, secure checkout with Stripe. Afterpay also available.' },
  { title: 'One-Click Return Trips', desc: 'Book your return journey in a single booking at the same time.' },
  { title: 'Specialist Routes', desc: 'Dedicated Hobbiton tours and cruise ship transfers — we know these routes inside out.' },
  { title: 'Oversized Luggage Welcome', desc: 'Skis, bikes, surfboards, golf clubs — we handle all your gear.' },
  { title: 'Fixed Transparent Pricing', desc: 'See your exact price before booking. No surge pricing, no hidden fees.' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white">

      {/* HERO */}
      <section className="relative min-h-[calc(100vh-88px)] flex items-center overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/95 to-transparent z-10" />
          <div className="absolute right-0 top-0 w-full lg:w-3/5 h-full">
            <img src="https://images.unsplash.com/photo-1522199873717-bc67b1a5e32b?auto=format&fit=crop&w=1920&q=80" alt="Professional traveller at Auckland airport" className="w-full h-full object-cover" style={{ objectPosition: 'center center' }} />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-gold via-gold/50 to-transparent" />
        </div>

        <div className="container-max px-4 sm:px-6 lg:px-8 relative z-10 py-20 sm:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-2 mb-6">
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span className="text-gold font-semibold text-sm tracking-wide">★★★★★ 5-STAR RATED</span>
              </motion.div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
                <span className="block mb-2">Premium</span>
                <span className="block bg-gradient-to-r from-gold via-yellow-300 to-gold bg-clip-text text-transparent" style={{ WebkitTextStroke: '1px rgba(212,175,55,0.3)' }}>Airport Transfers</span>
              </h1>

              <p className="text-xl sm:text-2xl text-gray-300 mb-8 leading-relaxed font-light">
                Your journey matters. Arrive in <span className="text-gold font-semibold">comfort</span>, <span className="text-gold font-semibold">style</span>, and <span className="text-gold font-semibold">safety</span>.
              </p>

              <div className="space-y-4 mb-10">
                {['Professional Drivers — Licensed & Experienced', 'Premium Vehicles — Immaculate & Comfortable', 'Fixed Rates — No Hidden Fees, Ever', 'Flight Tracking — We Monitor Your Arrival'].map((benefit, i) => (
                  <motion.div key={benefit} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }} className="flex items-center gap-4 group">
                    <div className="shrink-0 w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center group-hover:bg-gold/30 transition-colors">
                      <Check className="w-5 h-5 text-gold" strokeWidth={3} />
                    </div>
                    <span className="text-white text-base font-medium">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.5 }} className="flex flex-col sm:flex-row gap-4">
                <Link to="/book-now" className="flex-1 flex items-center justify-center gap-3 h-16 bg-gold hover:bg-yellow-500 text-black font-bold text-lg px-8 rounded-xl shadow-2xl hover:shadow-gold/50 hover:scale-105 transition-all duration-300 relative overflow-hidden group">
                  <span className="relative z-10 flex items-center gap-3">BOOK YOUR RIDE NOW <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" /></span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </Link>
                <Link to="/services" className="flex items-center justify-center h-16 border-2 border-gold text-gold hover:bg-gold/10 font-semibold text-lg px-8 rounded-xl backdrop-blur-sm hover:border-yellow-400 transition-all duration-300">VIEW SERVICES</Link>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.5 }} className="mt-8 pt-8 border-t border-white/10 flex flex-wrap items-center gap-8">
                {[{ icon: Shield, label: 'Fully Insured' }, { icon: Clock, label: '24/7 Support' }, { icon: Users, label: '10,000+ Happy Clients' }].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-gold" />
                    <span className="text-white/80 text-sm font-medium">{label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Glassmorphism card - desktop only */}
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-gold/30 to-yellow-500/20 rounded-[2rem] blur-2xl animate-pulse" />
                <div className="relative bg-white/10 backdrop-blur-2xl border border-white/30 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                  <h3 className="text-3xl font-bold text-white mb-4">Why Thousands Choose Us</h3>
                  <p className="text-white/80 text-lg leading-relaxed mb-8">New Zealand's most trusted airport transfer service. We don't just drive you — we deliver peace of mind.</p>
                  <div className="space-y-6 mb-8">
                    {[{ icon: Shield, title: '100% Reliable', desc: 'Never miss a flight. We track your arrival and adjust pickup times automatically.' }, { icon: DollarSign, title: 'Best Price Guarantee', desc: 'Fixed rates mean no surge pricing, no surprises. What you see is what you pay.' }, { icon: Award, title: '5-Star Experience', desc: 'Professional drivers, premium vehicles, VIP service. Travel like you deserve.' }].map(({ icon: Icon, title, desc }) => (
                      <div key={title} className="flex gap-4">
                        <div className="shrink-0 w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center"><Icon className="w-6 h-6 text-gold" /></div>
                        <div><h4 className="text-white font-bold text-lg mb-1">{title}</h4><p className="text-white/70 text-sm">{desc}</p></div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/10 backdrop-blur-xl rounded-xl p-5 border border-white/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-gold fill-gold" />)}</div>
                      <span className="text-gold font-bold text-lg">4.9/5</span>
                    </div>
                    <p className="text-white/90 text-sm italic mb-3">"Best airport transfer I've ever had in NZ. Professional, on-time, and great value. Highly recommend!"</p>
                    <p className="text-white/60 text-xs">— Michael T., International Traveller</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-white/60 text-xs font-medium tracking-wider">SCROLL TO EXPLORE</span>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2"><div className="w-1 h-3 bg-gold rounded-full animate-pulse" /></div>
        </motion.div>
      </section>

      {/* SERVICES - dark glassmorphism */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold/10 rounded-full blur-3xl" />
        </div>
        <div className="container-max px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="bg-gold/20 backdrop-blur-sm text-gold text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wide border border-gold/30">⚡ Instant Online Booking Available</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-6 mb-4">Our Services</h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">Whatever your transportation needs, we've got you covered</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES.map((service, i) => (
              <motion.div key={service.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ delay: i * 0.1, duration: 0.5 }} className="h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 transition-all duration-300 hover:bg-white/10 hover:border-gold/30 hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] hover:-translate-y-1 group">
                <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl flex items-center justify-center mb-6 group-hover:from-gold group-hover:to-yellow-500 transition-all duration-300 border border-gold/20 group-hover:border-gold">
                  <service.icon className="w-8 h-8 text-gold group-hover:text-black transition-colors duration-200" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{service.title}</h3>
                <p className="text-white/60 mb-6 text-sm leading-relaxed">{service.description}</p>
                <ul className="space-y-2">{service.features.map((f) => (<li key={f} className="flex items-center text-sm text-white/70"><Check className="w-4 h-4 text-gold mr-3 shrink-0" />{f}</li>))}</ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Best value airport transfers with modern convenience</p>
          </div>
          <div className="max-w-6xl mx-auto bg-white rounded-3xl border-2 border-gold/30 shadow-xl p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {WHY_CHOOSE.map(({ title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center"><Check className="w-6 h-6 text-gold" /></div>
                  <div><h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3><p className="text-gray-600 text-sm">{desc}</p></div>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-8 border-t border-gray-200 text-center">
              <p className="text-gray-700 mb-4 font-medium">Ready to experience the difference?</p>
              <Link to="/book-now" className="inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-black font-semibold px-10 py-4 rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-gold/30 hover:scale-105">
                Book Your Ride Now <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOBBITON */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto bg-gray-900/50 backdrop-blur rounded-3xl border-2 border-gold/30 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-10 lg:p-12 flex flex-col justify-center">
                <span className="inline-block bg-gold text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-4 w-fit">Popular Destination</span>
                <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">Hobbiton Movie Set Transfers</h3>
                <p className="text-gray-300 mb-6 text-lg leading-relaxed">Experience the magic of Middle-earth with our premium transfer service from Auckland to Hobbiton in Matamata. Comfortable, direct, and hassle-free.</p>
                <ul className="space-y-3 mb-8">
                  {['175km scenic journey through Waikato', 'Perfect timing for your Hobbiton tour', 'Return trips available'].map((item) => (
                    <li key={item} className="flex items-center text-gray-200"><Check className="w-5 h-5 text-gold mr-3 shrink-0" />{item}</li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/hobbiton-transfers" className="flex items-center justify-center gap-2 bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-4 rounded-xl transition-all duration-300">Learn More <ArrowRight className="w-5 h-5" /></Link>
                  <Link to="/book-now" className="flex items-center justify-center border-2 border-gold text-gold hover:bg-gold hover:text-black px-8 py-4 rounded-xl font-semibold transition-all duration-300">Book Now</Link>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gold/20 to-gold/5 p-10 lg:p-12 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-6">🧙‍♂️</div>
                  <p className="text-gold font-bold text-2xl mb-2">Get Instant Quote</p>
                  <p className="text-gray-400 text-sm">Live pricing online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Booking a ride is quick and easy</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div key={step.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ delay: i * 0.1, duration: 0.5 }} className="text-center relative group">
                {i < HOW_IT_WORKS.length - 1 && <div className="hidden lg:block absolute top-16 left-1/2 w-full h-px bg-gold/30 -z-10" />}
                <div className="w-32 h-32 bg-gradient-to-br from-gray-900 to-black border-2 border-gold/30 text-gold rounded-full flex items-center justify-center mx-auto mb-6 text-4xl font-bold shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">{step.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Don't just take our word for it</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ delay: i * 0.1, duration: 0.5 }} className="border-2 border-gray-200 hover:border-gold hover:shadow-xl transition-all duration-300 rounded-2xl p-8">
                <div className="flex mb-6">{[...Array(t.rating)].map((_, j) => <Star key={j} className="w-5 h-5 text-gold fill-gold" />)}</div>
                <p className="text-gray-700 mb-6 italic leading-relaxed">"{t.content}"</p>
                <div className="border-t border-gray-200 pt-4">
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-gradient-to-r from-gray-900 via-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.1),transparent_70%)]" />
        </div>
        <div className="container-max px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Book Your Ride?</h2>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">Get your instant price online and let us take care of your transportation needs.</p>
          <Link to="/book-now" className="inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-black font-semibold px-10 py-5 rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-gold/30 hover:scale-105">
            Book Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
