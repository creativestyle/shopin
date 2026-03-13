'use client'

import { useLocale } from 'next-intl'
import { RadioGroupItem } from '@/components/ui/radio-button'
import { cn } from '@/lib/utils'
import type { PaymentMethodResponse } from '@core/contracts/cart/payment-method'

interface PaymentMethodItemProps {
  method: PaymentMethodResponse
  selectedMethod: string
}

export function PaymentMethodItem({
  method,
  selectedMethod,
}: PaymentMethodItemProps) {
  const locale = useLocale()

  const description = method.localizedDescription?.[locale] || method.name

  return (
    <div
      className={cn(
        'flex flex-col gap-6 rounded px-4 py-6',
        selectedMethod === method.id
          ? 'border border-gray-950'
          : 'border border-gray-100'
      )}
    >
      <div className='flex items-center justify-between gap-3'>
        <div className='flex flex-1 items-center gap-3'>
          <RadioGroupItem
            value={method.id}
            id={`payment-method-${method.id}`}
            className='shrink-0'
          />
          <label
            htmlFor={`payment-method-${method.id}`}
            className='flex flex-1 cursor-pointer flex-col gap-1'
          >
            <span className='text-sm/[1.6] text-gray-700'>{description}</span>
          </label>
        </div>
      </div>
    </div>
  )
}
