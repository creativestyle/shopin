'use client'

import { useTranslations } from 'next-intl'
import { useCart } from '@/features/cart/cart-use-cart'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CheckoutAccountSelection } from '@/features/checkout/checkout-account-selection'
import { CheckoutRouteGuard } from '@/features/checkout/checkout-route-guard'
import { useCheckoutPageRedirect } from '@/features/checkout/checkout-use-checkout-page-redirect'
import { StandardContainer } from '@/components/ui/standard-container'

/**
 * Checkout page that handles /checkout route.
 * - If cart is missing/empty, CheckoutRouteGuard will redirect to cart page
 * - If no checkout step is done (billing incomplete), stays on this page (account selection)
 * - If any step is complete, redirects to the first incomplete step
 * - If all steps are complete, redirects to review page
 */
export default function CheckoutPage() {
  const { isLoading } = useCart()
  const t = useTranslations('checkout')
  const isRedirecting = useCheckoutPageRedirect()

  // Show loading state while checking cart or redirecting
  if (isLoading || isRedirecting) {
    return <LoadingSpinner className='size-8 min-h-[70vh]' />
  }

  // Show account selection if billing is not complete
  return (
    <CheckoutRouteGuard currentStepId='billing'>
      <h1 className='sr-only'>{t('accountSelectionTitle')}</h1>
      <StandardContainer className='flex w-full flex-1 flex-col py-8 pb-16 lg:py-16'>
        <CheckoutAccountSelection />
      </StandardContainer>
    </CheckoutRouteGuard>
  )
}
