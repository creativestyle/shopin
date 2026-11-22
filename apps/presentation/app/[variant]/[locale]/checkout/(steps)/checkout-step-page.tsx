import { ensureCheckoutStep } from '@/features/checkout/checkout-server-guard'
import type { CheckoutStepId } from '@/features/checkout/checkout-server-guard'
import { CheckoutRouteGuard } from '@/features/checkout/checkout-route-guard'
import { CartHydrationBoundary } from '@/features/cart/cart-hydration-boundary'
import { CheckoutStepsFrame } from '@/features/checkout/checkout-steps-frame'

interface CheckoutStepPageProps {
  stepId: CheckoutStepId
  children: React.ReactNode
}

export async function CheckoutStepPage({
  stepId,
  children,
}: CheckoutStepPageProps) {
  const cart = await ensureCheckoutStep(stepId)

  return (
    <CartHydrationBoundary cart={cart}>
      <CheckoutRouteGuard currentStepId={stepId}>
        <CheckoutStepsFrame currentStepId={stepId}>
          {children}
        </CheckoutStepsFrame>
      </CheckoutRouteGuard>
    </CartHydrationBoundary>
  )
}
