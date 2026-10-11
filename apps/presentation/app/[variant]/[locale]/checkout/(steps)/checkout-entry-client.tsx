'use client'

import { useTranslations } from 'next-intl'
import { useCart } from '@/features/cart/cart-use-cart'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CheckoutAccountSelection } from '@/features/checkout/checkout-account-selection'
import { CheckoutRouteGuard } from '@/features/checkout/checkout-route-guard'
import { useCheckoutPageRedirect } from '@/features/checkout/checkout-use-checkout-page-redirect'
import { StandardContainer } from '@/components/ui/standard-container'

export function CheckoutEntryClient() {
  const { isLoading } = useCart()
  const t = useTranslations('checkout')
  const isRedirecting = useCheckoutPageRedirect()

  if (isLoading || isRedirecting) {
    return <LoadingSpinner className='size-8 min-h-[70vh]' />
  }

  return (
    <CheckoutRouteGuard currentStepId='billing'>
      <h1 className='sr-only'>{t('accountSelectionTitle')}</h1>
      <StandardContainer className='flex w-full flex-1 flex-col py-8 pb-16 lg:py-16'>
        <CheckoutAccountSelection />
      </StandardContainer>
    </CheckoutRouteGuard>
  )
}
