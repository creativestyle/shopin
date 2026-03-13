import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/features/cart/cart-use-cart'
import {
  getFirstIncompleteStep,
  isStepComplete,
} from './components/checkout-steps-frame/checkout-step-validation'
import { CHECKOUT_STEPS } from './components/checkout-steps-frame/checkout-steps-config'

/**
 * Hook that handles redirect logic for the checkout page (/checkout route).
 * Returns true if redirecting (should show loading), false otherwise.
 */
export function useCheckoutPageRedirect(): boolean {
  const router = useRouter()
  const { cart, isLoading } = useCart()

  const isCartEmpty = !cart || cart.itemCount === 0
  const reviewStep = CHECKOUT_STEPS.find((step) => step.id === 'review')

  let shouldRedirect = false
  if (!isLoading && !isCartEmpty) {
    const isBillingComplete = isStepComplete('billing', cart)
    if (isBillingComplete) {
      shouldRedirect = true
    }
  }

  useEffect(() => {
    if (isLoading || isCartEmpty) {
      return
    }

    const firstIncompleteStep = getFirstIncompleteStep(cart)
    const isBillingComplete = isStepComplete('billing', cart)

    if (!isBillingComplete) {
      return
    }

    if (firstIncompleteStep) {
      router.push(firstIncompleteStep.route, { scroll: false })
      return
    }

    if (reviewStep) {
      router.push(reviewStep.route, { scroll: false })
      return
    }
  }, [cart, isLoading, router, isCartEmpty, reviewStep])

  return shouldRedirect
}
