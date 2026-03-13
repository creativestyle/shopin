'use client'

import { useRouter } from 'next/navigation'
import { getNextStep, type CheckoutStepId } from './checkout-steps-config'

export function useCheckoutNavigation(currentStepId: CheckoutStepId) {
  const router = useRouter()

  function handleNextStep() {
    const nextRoute = getNextStep(currentStepId)?.route
    if (nextRoute) {
      router.push(nextRoute, { scroll: false })
    }
  }

  return { handleNextStep }
}
