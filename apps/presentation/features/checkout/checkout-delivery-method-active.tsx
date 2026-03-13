'use client'

import { useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useCheckoutNavigation } from './components/checkout-steps-frame/use-checkout-navigation'
import { getNextStep } from './components/checkout-steps-frame/checkout-steps-config'
import { useCheckoutButtonLabel } from './components/checkout-steps-frame/use-checkout-button-label'
import { useShippingMethods } from './hooks/use-shipping-methods'
import { useSetShippingMethod } from './hooks/use-set-shipping-method'
import { useDeliveryMethodSelection } from './hooks/use-delivery-method-selection'
import { useCart } from '@/features/cart/cart-use-cart'
import { DeliveryMethodOptions } from './components/delivery-method/delivery-method-options'
import { debounce } from '@/lib/debounce'

const SHIPPING_METHOD_UPDATE_DELAY = 500

export function DeliveryMethodActive() {
  const t = useTranslations('checkout.deliveryMethod')
  const { handleNextStep } = useCheckoutNavigation('deliveryMethod')
  const buttonLabel = useCheckoutButtonLabel('deliveryMethod')
  const { cart } = useCart()
  const hasShippingAddress = !!cart?.id && !!cart?.shippingAddress
  const { data: shippingMethodsData } = useShippingMethods(hasShippingAddress)
  const { handleSetShippingMethod, isPending } = useSetShippingMethod()

  const shippingMethods = shippingMethodsData?.shippingMethods || []

  const { selectedMethod, setSelectedMethod } = useDeliveryMethodSelection({
    shippingMethods,
    cartShippingMethodId: cart?.shippingInfo?.shippingMethodId,
  })

  const selectedShippingMethodIdRef = useRef<string>(selectedMethod)
  const currentCartRef = useRef(cart)
  const handleSetShippingMethodRef = useRef(handleSetShippingMethod)
  const debouncedSetShippingMethodRef = useRef<ReturnType<
    typeof debounce
  > | null>(null)

  useEffect(() => {
    selectedShippingMethodIdRef.current = selectedMethod
    currentCartRef.current = cart
    handleSetShippingMethodRef.current = handleSetShippingMethod
  }, [selectedMethod, cart, handleSetShippingMethod])

  useEffect(() => {
    debouncedSetShippingMethodRef.current = debounce(() => {
      const shippingMethodId = selectedShippingMethodIdRef.current
      const cart = currentCartRef.current
      if (
        shippingMethodId &&
        shippingMethodId !== cart?.shippingInfo?.shippingMethodId
      ) {
        void handleSetShippingMethodRef.current({ shippingMethodId })
      }
    }, SHIPPING_METHOD_UPDATE_DELAY)

    return () => {
      debouncedSetShippingMethodRef.current?.cancel()
    }
  }, [])

  const handleShippingMethodChange = (shippingMethodId: string) => {
    setSelectedMethod(shippingMethodId)
    selectedShippingMethodIdRef.current = shippingMethodId

    if (
      shippingMethodId &&
      shippingMethodId !== cart?.shippingInfo?.shippingMethodId
    ) {
      debouncedSetShippingMethodRef.current?.()
    }
  }

  const handleContinue = async () => {
    if (selectedMethod) {
      const updatedCart = await handleSetShippingMethod({
        shippingMethodId: selectedMethod,
      })
      if (!updatedCart) {
        return
      }
      handleNextStep()
    }
  }

  if (shippingMethods.length === 0) {
    return <div className='text-gray-600'>{t('noMethodsAvailable')}</div>
  }

  return (
    <>
      <DeliveryMethodOptions
        shippingMethods={shippingMethods}
        selectedMethod={selectedMethod}
        onValueChange={handleShippingMethodChange}
      />
      {getNextStep('deliveryMethod') !== null && (
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
  )
}
