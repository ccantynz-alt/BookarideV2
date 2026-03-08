export default function Terms() {
  return (
    <div className="py-20 min-h-[calc(100vh-88px)]">
      <div className="container-max px-4 sm:px-6 max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms &amp; Conditions</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: March 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600 leading-relaxed">

          <Section title="1. Agreement">
            <p>By booking a service with BookARide NZ ("we", "us", "our"), you agree to these Terms and Conditions. Please read them carefully before completing your booking.</p>
          </Section>

          <Section title="2. Bookings & Payment">
            <ul>
              <li>All prices are in New Zealand Dollars (NZD) and are inclusive of GST.</li>
              <li>Payment is taken in full at the time of booking via Stripe's secure payment gateway.</li>
              <li>A booking confirmation email will be sent to the email address provided once payment is processed.</li>
              <li>BookARide NZ reserves the right to refuse or cancel a booking at its discretion, in which case a full refund will be issued.</li>
            </ul>
          </Section>

          <Section title="3. Cancellation & Refund Policy">
            <ul>
              <li><strong>More than 24 hours before pickup:</strong> Full refund, no cancellation fee.</li>
              <li><strong>Less than 24 hours before pickup:</strong> No refund. You may reschedule at our discretion.</li>
              <li><strong>No-shows:</strong> No refund will be issued if the passenger is not at the agreed pickup location.</li>
              <li>To cancel, contact us by phone (021 880 793) or email (info@bookaride.co.nz) with your booking reference number.</li>
            </ul>
          </Section>

          <Section title="4. Flight Monitoring">
            <p>We monitor incoming flights and adjust pickup times for arriving passengers at no extra charge. If your flight details change, please notify us as soon as possible. We are not liable for delays caused by incorrect flight information provided at the time of booking.</p>
          </Section>

          <Section title="5. Waiting Time">
            <ul>
              <li><strong>Domestic arrivals:</strong> Up to 30 minutes free waiting time after the scheduled arrival.</li>
              <li><strong>International arrivals:</strong> Up to 60 minutes free waiting time after the scheduled arrival.</li>
              <li><strong>Departures:</strong> Your driver will arrive at the scheduled pickup time. If you are not ready within 15 minutes, the driver may leave and no refund will be issued.</li>
            </ul>
          </Section>

          <Section title="6. Luggage">
            <p>Standard luggage allowance is one standard suitcase and one carry-on bag per passenger. Oversized luggage, sports equipment, or excess luggage must be declared at the time of booking. An oversized luggage fee applies. We are not liable for damage to luggage unless caused by our negligence.</p>
          </Section>

          <Section title="7. Child Seats">
            <p>Child seat requests must be made at the time of booking. We carry standard and booster seats. For legal compliance, caregivers are responsible for correctly securing children in seats. We accept no liability for injuries caused by improper use of child restraints.</p>
          </Section>

          <Section title="8. Passenger Conduct">
            <p>Passengers are expected to behave in a manner that is respectful to the driver and other passengers. Intoxicated passengers or those engaging in antisocial behaviour may be refused service without a refund. Eating and drinking (other than water) are not permitted in vehicles.</p>
          </Section>

          <Section title="9. Liability">
            <p>BookARide NZ and its drivers are not liable for any delays caused by traffic, road conditions, weather, or other circumstances beyond our control. Our liability is limited to the value of the booking in all circumstances. We carry comprehensive public liability insurance.</p>
          </Section>

          <Section title="10. Privacy">
            <p>Your personal information is collected and used in accordance with our <a href="/privacy-policy" className="text-gold hover:underline">Privacy Policy</a>. We do not sell your data to third parties.</p>
          </Section>

          <Section title="11. Changes to These Terms">
            <p>We reserve the right to update these Terms at any time. The most current version will always be available on this page. Continued use of our services constitutes acceptance of any changes.</p>
          </Section>

          <Section title="12. Governing Law">
            <p>These Terms are governed by the laws of New Zealand. Any disputes will be subject to the exclusive jurisdiction of the New Zealand courts.</p>
          </Section>

          <div className="pt-6 border-t border-gray-200 text-sm text-gray-400">
            <p>BookARide NZ · Auckland, New Zealand</p>
            <p><a href="tel:+6421880793" className="text-gold hover:underline">021 880 793</a> · <a href="mailto:info@bookaride.co.nz" className="text-gold hover:underline">info@bookaride.co.nz</a></p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-2 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1.5">{children}</div>
    </div>
  )
}
