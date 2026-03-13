import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/features/cart/cart-use-cart'
import type { CheckoutStepId } from '../components/checkout-steps-frame/checkout-steps-config'
import { getFirstIncompleteStep } from '../components/checkout-steps-frame/checkout-step-validation'

interface UseCheckoutRouteGuardOptions {
  currentStepId: CheckoutStepId
}

interface UseCheckoutRouteGuardReturn {
  isLoading: boolean
  isAccessible: boolean
}

/**
 * Hook that handles checkout route guard logic:
 * - Redirects users away from checkout pages if they don't have a cart with items
 * - Redirects users to the first incomplete step if they try to access a step without completing previous steps
 */
export function useCheckoutRouteGuard({
  currentStepId,
}: UseCheckoutRouteGuardOptions): UseCheckoutRouteGuardReturn {
  const router = useRouter()
  const { cart, isLoading: isCartLoading } = useCart()

  const isCartEmpty = !cart || cart.itemCount === 0

  let arePreviousStepsComplete = false
  if (cart && !isCartEmpty) {
    const incompleteStep = getFirstIncompleteStep(cart, currentStepId)
    arePreviousStepsComplete = !incompleteStep
  }

  useEffect(() => {
    if (!isCartLoading && isCartEmpty) {
      router.push('/cart', { scroll: false })
      return
    }

    if (!isCartLoading && !isCartEmpty) {
      const incompleteStep = getFirstIncompleteStep(cart, currentStepId)
      if (incompleteStep) {
        router.push(incompleteStep.route, { scroll: false })
      }
    }
  }, [cart, isCartLoading, router, isCartEmpty, currentStepId])

  const isRedirecting = isCartEmpty || !arePreviousStepsComplete
  const isLoading = isCartLoading || isRedirecting

  let isAccessible = false
  if (!isCartLoading && !isCartEmpty) {
    isAccessible = arePreviousStepsComplete
  }

  return { isLoading, isAccessible }
}
