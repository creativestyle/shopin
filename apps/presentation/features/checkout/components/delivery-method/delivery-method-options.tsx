'use client'

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
  return (
    <div className='flex flex-col gap-6'>
      <RadioGroup
        value={selectedMethod}
        onValueChange={onValueChange}
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
