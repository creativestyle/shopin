'use client'

import { cn } from '@/lib/utils'
import {
  CHECKOUT_STEPS,
  type CheckoutStepId,
} from './components/checkout-steps-frame/checkout-steps-config'
import { CheckoutStepPrevious } from './components/checkout-steps-frame/checkout-step-previous'
import { CheckoutStepCurrent } from './components/checkout-steps-frame/checkout-step-current'
import { CheckoutStepFuture } from './components/checkout-steps-frame/checkout-step-future'
import { CheckoutOrderSummary } from './components/checkout-steps-frame/checkout-order-summary'
import { useCheckoutStepTitle } from './components/checkout-steps-frame/use-checkout-step-title'
import { StandardContainer } from '@/components/ui/standard-container'

interface CheckoutStepsFrameProps {
  currentStepId: CheckoutStepId
  children?: React.ReactNode
  className?: string
}

export function CheckoutStepsFrame({
  currentStepId,
  children,
  className,
}: CheckoutStepsFrameProps) {
  const steps = CHECKOUT_STEPS
  const currentStepIndex = steps.findIndex((step) => step.id === currentStepId)
  const previousSteps = steps.slice(0, currentStepIndex)
  const currentStep = steps[currentStepIndex]
  const futureSteps = steps.slice(currentStepIndex + 1)
  const pageTitle = useCheckoutStepTitle(currentStep)

  return (
    <StandardContainer className='w-full py-6'>
      {pageTitle && <h1 className='sr-only'>{pageTitle}</h1>}
      <div
        className={cn(
          'ui-checkout-max-width-container grid w-full grid-cols-1 gap-8 lg:grid-cols-[5fr_3fr]',
          className
        )}
      >
        <div className='flex flex-col gap-6'>
          {previousSteps.map((step) => (
            <CheckoutStepPrevious
              key={step.id}
              step={step}
            />
          ))}

          {currentStep && (
            <CheckoutStepCurrent step={currentStep}>
              {children}
            </CheckoutStepCurrent>
          )}

          {futureSteps.map((step) => (
            <CheckoutStepFuture
              key={step.id}
              step={step}
            />
          ))}
        </div>

        <CheckoutOrderSummary />
      </div>
    </StandardContainer>
  )
}
