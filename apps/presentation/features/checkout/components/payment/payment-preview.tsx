'use client'

import { useCart } from '@/features/cart/cart-use-cart'
import { useLocale, useTranslations } from 'next-intl'
import { usePaymentMethods } from '../../hooks/use-payment-methods'
import { getPaymentMethodId, getPaymentProvider } from '../../lib/payment-utils'

export function PaymentPreview() {
  const locale = useLocale()
  const t = useTranslations('checkout.payment')
  const { cart } = useCart()
  const hasCart = !!cart?.id
  const { data: paymentMethodsData } = usePaymentMethods(hasCart)

  const paymentMethodId = cart?.paymentInfo
    ? getPaymentMethodId(cart.paymentInfo)
    : undefined
  const provider = cart?.paymentInfo
    ? getPaymentProvider(cart.paymentInfo)
    : undefined
  const paymentMethods = paymentMethodsData?.paymentMethods || []

  let selectedMethod
  if (paymentMethodId) {
    selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId)
  }

  let description
  if (selectedMethod) {
    description =
      selectedMethod.localizedDescription?.[locale] || selectedMethod.name
  }

  return (
    <>
      {paymentMethodId && selectedMethod && (
        <div className='space-y-1 text-sm text-gray-700'>
          <div>{description}</div>
          {provider && (
            <div className='text-gray-600'>
              {t('via', { interface: provider })}
            </div>
          )}
        </div>
      )}
    </>
  )
}
