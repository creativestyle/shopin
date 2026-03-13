'use client'

import { useTranslations } from 'next-intl'
import { CheckoutStep } from './checkout-steps-config'

/**
 * Hook to get the translated title for a checkout step.
 */
export function useCheckoutStepTitle(
  step: CheckoutStep | null
): string | undefined {
  const tSteps = useTranslations('checkout.steps')

  if (!step) {
    return undefined
  }

  return tSteps(step.translationKey)
}
