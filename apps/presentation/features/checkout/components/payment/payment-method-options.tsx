'use client'

import { RadioGroup } from '@/components/ui/radio-button'
import type { PaymentMethodResponse } from '@core/contracts/cart/payment-method'
import { PaymentMethodItem } from './payment-method-item'

interface PaymentMethodOptionsProps {
  paymentMethods: PaymentMethodResponse[]
  selectedMethod: string
  onValueChange: (value: string) => void
}

export function PaymentMethodOptions({
  paymentMethods,
  selectedMethod,
  onValueChange,
}: PaymentMethodOptionsProps) {
  return (
    <div className='flex flex-col gap-6'>
      <RadioGroup
        value={selectedMethod}
        onValueChange={onValueChange}
        className='flex flex-col gap-2'
      >
        {paymentMethods.map((method) => (
          <PaymentMethodItem
            key={method.id}
            method={method}
            selectedMethod={selectedMethod}
          />
        ))}
      </RadioGroup>
    </div>
  )
}
