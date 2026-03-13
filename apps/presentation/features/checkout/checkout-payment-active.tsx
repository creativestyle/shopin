'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useCheckoutNavigation } from './components/checkout-steps-frame/use-checkout-navigation'
import { getNextStep } from './components/checkout-steps-frame/checkout-steps-config'
import { useCheckoutButtonLabel } from './components/checkout-steps-frame/use-checkout-button-label'
import { usePaymentMethods } from './hooks/use-payment-methods'
import { useSetPaymentMethod } from './hooks/use-set-payment-method'
import { usePaymentMethodSelection } from './hooks/use-payment-method-selection'
import { useCart } from '@/features/cart/cart-use-cart'
import { PaymentMethodOptions } from './components/payment/payment-method-options'
import { getPaymentMethodId } from './lib/payment-utils'

export function PaymentActive() {
  const t = useTranslations('checkout.payment')
  const locale = useLocale()
  const { handleNextStep } = useCheckoutNavigation('payment')
  const buttonLabel = useCheckoutButtonLabel('payment')
  const { cart } = useCart()
  const hasCart = !!cart?.id
  const { data: paymentMethodsData } = usePaymentMethods(hasCart)
  const { handleSetPaymentMethod, isPending } = useSetPaymentMethod()

  const paymentMethods = paymentMethodsData?.paymentMethods || []

  const cartPaymentMethodId = cart?.paymentInfo
    ? getPaymentMethodId(cart.paymentInfo)
    : undefined

  const { selectedMethod, setSelectedMethod } = usePaymentMethodSelection({
    paymentMethods,
    cartPaymentMethodId,
  })

  const handleContinue = async () => {
    if (selectedMethod) {
      const selectedPaymentMethod = paymentMethods.find(
        (method) => method.id === selectedMethod
      )

      if (!selectedPaymentMethod?.paymentInterface) {
        return
      }

      const localizedName =
        selectedPaymentMethod.localizedDescription?.[locale] ||
        selectedPaymentMethod.name

      const updatedCart = await handleSetPaymentMethod({
        paymentMethodId: selectedPaymentMethod.id,
        paymentInterface: selectedPaymentMethod.paymentInterface,
        paymentMethodName: localizedName,
        localizedDescription: selectedPaymentMethod.localizedDescription,
      })
      if (!updatedCart) {
        return
      }
      handleNextStep()
    }
  }

  const handlePaymentMethodChange = (value: string) => {
    setSelectedMethod(value)
  }

  return (
    <>
      {paymentMethods.length === 0 && (
        <div className='text-gray-600'>{t('noMethodsAvailable')}</div>
      )}
      {paymentMethods.length > 0 && (
        <>
          <PaymentMethodOptions
            paymentMethods={paymentMethods}
            selectedMethod={selectedMethod}
            onValueChange={handlePaymentMethodChange}
          />
          {getNextStep('payment') !== null && (
            <div className='mt-6 flex justify-end'>
              <Button
                variant='primary'
                scheme='red'
                onClick={handleContinue}
                disabled={!selectedMethod || isPending}
                className='w-full'
              >
                {buttonLabel}
              </Button>
            </div>
          )}
        </>
      )}
    </>
  )
}
