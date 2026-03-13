'use client'

import { useTranslations } from 'next-intl'
import { getNextStep, type CheckoutStepId } from './checkout-steps-config'
import { useCheckoutStepTitle } from './use-checkout-step-title'

/**
 * Hook to get the translated button label for continuing to the next checkout step.
 * Returns "Continue to {nextStep}" if there's a next step, or "Complete"/"Place Order" for the final step.
 */
export function useCheckoutButtonLabel(currentStepId: CheckoutStepId): string {
  const tSteps = useTranslations('checkout.steps')
  const nextStep = getNextStep(currentStepId)
  const nextStepTitle = useCheckoutStepTitle(nextStep)

  if (nextStep && nextStepTitle) {
    return tSteps('continueTo', { step: nextStepTitle })
  }

  // For review step, use "Place Order", otherwise "Complete"
  if (currentStepId === 'review') {
    return tSteps('placeOrder')
  }

  return tSteps('completeLabel')
}
