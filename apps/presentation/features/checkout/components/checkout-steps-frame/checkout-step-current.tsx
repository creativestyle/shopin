'use client'

import { useLayoutEffect, useRef } from 'react'
import CheckmarkIcon from '@/public/icons/checkmark.svg'
import { cn } from '@/lib/utils'
import { useCart } from '@/features/cart/cart-use-cart'
import type { CheckoutStep } from './checkout-steps-config'
import { useCheckoutStepTitle } from './use-checkout-step-title'
import { isStepComplete } from './checkout-step-validation'

interface CheckoutStepCurrentProps {
  step: CheckoutStep
  children?: React.ReactNode
}

export function CheckoutStepCurrent({
  step,
  children,
}: CheckoutStepCurrentProps) {
  const stepTitle = useCheckoutStepTitle(step)
  const stepRef = useRef<HTMLDivElement>(null)
  const { cart } = useCart()
  const isStepCompleted =
    step.id !== 'complete' && isStepComplete(step.id, cart)

  // Scroll into view and focus when step becomes active
  useLayoutEffect(() => {
    if (stepRef.current) {
      const element = stepRef.current

      element.scrollIntoView({
        behavior: 'auto',
        block: 'start',
      })

      // Focus the step element for accessibility
      element.focus()
    }
  }, [step.id])

  return (
    <div
      ref={stepRef}
      tabIndex={-1}
      role='region'
      aria-label={stepTitle}
      className='w-full scroll-mt-6 rounded-lg border border-gray-100 bg-white px-8 pt-4 pb-6 shadow-card focus:ring-0 focus:ring-offset-0 focus:outline-none'
    >
      <div className='mb-6 flex items-center gap-4'>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white',
            isStepCompleted
              ? 'text-gray-700'
              : 'text-base/[1.6] font-bold text-gray-950'
          )}
        >
          {isStepCompleted ? (
            <CheckmarkIcon className='h-6 w-6' />
          ) : (
            step.number
          )}
        </div>
        <h2 className='text-sm/[1.6] font-bold text-gray-950'>{stepTitle}</h2>
      </div>

      <div className='lg:px-14'>{children}</div>
    </div>
  )
}
