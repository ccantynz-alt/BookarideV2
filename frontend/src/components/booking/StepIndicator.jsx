import { CheckCircle } from 'lucide-react'
import { cn } from '../../lib/cn'

const STEPS = ['Trip Details', 'Your Details', 'Confirm & Pay']

export default function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8" role="navigation" aria-label="Booking progress">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                i < currentStep
                  ? 'bg-gold text-black scale-90'
                  : i === currentStep
                    ? 'bg-gray-900 text-gold ring-2 ring-gold ring-offset-2'
                    : 'bg-gray-200 text-gray-400'
              )}
              aria-current={i === currentStep ? 'step' : undefined}
            >
              {i < currentStep ? <CheckCircle className="w-5 h-5" /> : i + 1}
            </div>
            <span
              className={cn(
                'text-sm font-medium hidden sm:block transition-colors',
                i <= currentStep ? 'text-gray-900' : 'text-gray-400'
              )}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                'w-6 sm:w-10 h-0.5 mx-0.5 sm:mx-1 transition-colors duration-300',
                i < currentStep ? 'bg-gold' : 'bg-gray-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}
