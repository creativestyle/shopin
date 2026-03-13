'use client'

import { useLocale } from 'next-intl'
import { RadioGroupItem } from '@/components/ui/radio-button'
import { cn } from '@/lib/utils'
import type { ShippingMethodResponse } from '@core/contracts/cart/shipping-method'
import { DeliveryMethodLabel } from './delivery-method-label'

interface DeliveryMethodItemProps {
  method: ShippingMethodResponse
  selectedMethod: string
}

export function DeliveryMethodItem({
  method,
  selectedMethod,
}: DeliveryMethodItemProps) {
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
            id={`shipping-method-${method.id}`}
            className='shrink-0'
          />
          <label
            htmlFor={`shipping-method-${method.id}`}
            className='flex flex-1'
          >
            <DeliveryMethodLabel
              name={description}
              priceInCents={method.price.centAmount}
              currency={method.price.currencyCode}
              freeAboveInCents={method.freeAbove?.centAmount}
              freeAboveCurrency={method.freeAbove?.currencyCode}
            />
          </label>
        </div>
      </div>
    </div>
  )
}
