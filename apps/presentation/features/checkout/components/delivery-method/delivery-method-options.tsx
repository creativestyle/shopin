'use client'

import { useTranslations } from 'next-intl'
import { RadioGroup } from '@/components/ui/radio-button'
import type { ShippingMethodResponse } from '@core/contracts/cart/shipping-method'
import { DeliveryMethodItem } from './delivery-method-item'

interface DeliveryMethodOptionsProps {
  shippingMethods: ShippingMethodResponse[]
  selectedMethod: string
  onValueChange: (value: string) => void
}

export function DeliveryMethodOptions({
  shippingMethods,
  selectedMethod,
  onValueChange,
}: DeliveryMethodOptionsProps) {
  const t = useTranslations('checkout.deliveryMethod')

  return (
    <div className='flex flex-col gap-6'>
      <RadioGroup
        value={selectedMethod}
        onValueChange={onValueChange}
        aria-label={t('title')}
        className='flex flex-col gap-2'
      >
        {shippingMethods.map((method) => (
          <DeliveryMethodItem
            key={method.id}
            method={method}
            selectedMethod={selectedMethod}
          />
        ))}
      </RadioGroup>
    </div>
  )
}
