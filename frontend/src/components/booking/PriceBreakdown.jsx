import { motion } from 'framer-motion'
import { DollarSign, CreditCard, Shield } from 'lucide-react'

export default function PriceBreakdown({ pricing, bookReturn, compact }) {
  if (!pricing) return null

  const rows = [
    { label: `Base fare (${pricing.distance.toFixed(1)} km)`, amount: pricing.basePrice },
    pricing.airportFee > 0 && { label: 'VIP Airport Pickup', amount: pricing.airportFee },
    pricing.oversizedLuggageFee > 0 && { label: 'Oversized Luggage', amount: pricing.oversizedLuggageFee },
    pricing.passengerFee > 0 && { label: 'Extra passengers', amount: pricing.passengerFee },
  ].filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200"
      data-testid="price-breakdown"
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-gold" />
        Price Breakdown {bookReturn && <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full">Return Trip</span>}
      </h3>

      <div className="space-y-2 mb-3">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-gray-500">{row.label}</span>
            <span className="text-gray-700 font-medium">${row.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="text-gray-700">${pricing.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5" /> Card processing
          </span>
          <span className="text-gray-700">${pricing.stripeFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="text-base font-bold text-gray-900">Total</span>
          <span className="text-lg font-bold text-gold">${pricing.totalPrice.toFixed(2)} NZD</span>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
          <Shield className="w-3.5 h-3.5" />
          <span>Fixed price — no hidden fees or surge pricing</span>
        </div>
      )}
    </motion.div>
  )
}
