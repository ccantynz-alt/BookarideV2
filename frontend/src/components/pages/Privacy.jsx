export default function Privacy() {
  return (
    <div className="py-20 min-h-[calc(100vh-88px)]">
      <div className="container-max px-4 sm:px-6 max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: March 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600 leading-relaxed">

          <Section title="1. Who We Are">
            <p>BookARide NZ ("we", "us", "our") operates a private transfer and airport shuttle service based in Auckland, New Zealand. Our website is <a href="https://bookaride.co.nz" className="text-gold hover:underline">bookaride.co.nz</a>.</p>
          </Section>

          <Section title="2. Information We Collect">
            <p>We collect the following personal information when you make a booking or contact us:</p>
            <ul>
              <li>Name, email address, and phone number</li>
              <li>Pickup and drop-off addresses</li>
              <li>Travel date, time, and flight details</li>
              <li>Payment information (processed by Stripe — we never see your full card details)</li>
              <li>Special requests (child seats, oversized luggage, etc.)</li>
            </ul>
            <p>We may also automatically collect technical data such as your IP address, browser type, and pages visited via analytics tools.</p>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul>
              <li>To process and confirm your booking</li>
              <li>To communicate with you about your transfer (confirmation, reminders, driver contact)</li>
              <li>To process your payment securely via Stripe</li>
              <li>To improve our service and website</li>
              <li>To comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="4. Third-Party Services">
            <p>We use the following trusted third-party services to operate our business:</p>
            <ul>
              <li><strong>Stripe</strong> — payment processing (<a href="https://stripe.com/nz/privacy" className="text-gold hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>)</li>
              <li><strong>Google Maps</strong> — address autocomplete and distance calculation</li>
              <li><strong>Mailgun</strong> — email delivery</li>
              <li><strong>Twilio</strong> — SMS notifications</li>
            </ul>
            <p>Each provider has their own privacy policy. We only share the minimum data required for each service to function.</p>
          </Section>

          <Section title="5. Data Retention">
            <p>We retain booking records for 7 years as required by New Zealand tax law. You may request deletion of your personal data at any time, subject to these legal requirements.</p>
          </Section>

          <Section title="6. Data Security">
            <p>We take reasonable steps to protect your personal information. Our website uses HTTPS encryption. Payment data is handled exclusively by Stripe, a PCI-DSS Level 1 certified provider. We do not store credit card numbers.</p>
          </Section>

          <Section title="7. Your Rights">
            <p>Under the New Zealand Privacy Act 2020, you have the right to:</p>
            <ul>
              <li>Request access to the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your data (subject to legal retention requirements)</li>
              <li>Opt out of marketing communications at any time</li>
            </ul>
            <p>To exercise these rights, contact us at <a href="mailto:info@bookaride.co.nz" className="text-gold hover:underline">info@bookaride.co.nz</a>.</p>
          </Section>

          <Section title="8. Cookies">
            <p>Our website uses essential cookies to remember your preferences (such as returning customer details). We do not use tracking or advertising cookies. You can disable cookies in your browser settings, though some features may not work correctly.</p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. The latest version will always be available on this page. We encourage you to review it periodically.</p>
          </Section>

          <Section title="10. Contact Us">
            <p>For any privacy-related questions or requests:</p>
            <ul>
              <li>Email: <a href="mailto:info@bookaride.co.nz" className="text-gold hover:underline">info@bookaride.co.nz</a></li>
              <li>Phone: <a href="tel:+6421880793" className="text-gold hover:underline">021 880 793</a></li>
            </ul>
          </Section>

          <div className="pt-6 border-t border-gray-200 text-sm text-gray-400">
            <p>BookARide NZ · Auckland, New Zealand</p>
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
