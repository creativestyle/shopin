'use client'

import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useCheckoutRouteGuard } from './hooks/use-checkout-route-guard'
import type { CheckoutStepId } from './components/checkout-steps-frame/checkout-steps-config'

interface CheckoutRouteGuardProps {
  children: React.ReactNode
  currentStepId: CheckoutStepId
}

/**
 * Route guard that redirects users away from checkout pages if they don't have a cart with items,
 * and redirects users to the first incomplete step if they try to access a step without completing previous steps.
 *
 * This component uses the `useCheckoutRouteGuard` hook to handle all redirect logic:
 * - If a user doesn't have a cart or the cart is empty, they will be redirected to the cart page
 * - If a user tries to access a step without completing previous steps, they will be redirected to the first incomplete step
 *
 * Shows a loading state while checking cart status and step validation.
 *
 * @example
 * ```tsx
 * <CheckoutRouteGuard currentStepId="shipping">
 *   <CheckoutShipping />
 * </CheckoutRouteGuard>
 * ```
 */
export function CheckoutRouteGuard({
  children,
  currentStepId,
}: CheckoutRouteGuardProps) {
  const { isLoading, isAccessible } = useCheckoutRouteGuard({ currentStepId })

  if (isLoading) {
    return <LoadingSpinner className='size-8 min-h-[70vh]' />
  }

  if (!isAccessible) {
    return null
  }

  return <>{children}</>
}
