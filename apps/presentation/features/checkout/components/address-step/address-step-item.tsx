'use client'

import { RadioGroupItem } from '@/components/ui/radio-button'
import { AddressResponse } from '@core/contracts/customer/address'
import { useFormatAddressLines } from '@/features/address/use-format-address-lines'
import { cn } from '@/lib/utils'
import type { AddressType } from '@core/contracts/address/address-base'

interface AddressStepItemProps {
  address: AddressResponse
  addressType: AddressType
}

export function AddressStepItem({
  address,
  addressType,
}: AddressStepItemProps) {
  const addressLines = useFormatAddressLines(address)

  return (
    <div className='flex items-start gap-3'>
      <RadioGroupItem
        value={address.id || ''}
        id={`${addressType}-address-${address.id}`}
        className='mt-1'
      />
      <label
        htmlFor={`${addressType}-address-${address.id}`}
        className='flex-1 cursor-pointer space-y-0.5'
      >
        {addressLines.map((line, index) => (
          <div
            key={index}
            className={cn('text-sm leading-tight', {
              'font-medium text-gray-900': index === 0,
              'text-gray-600': index !== 0,
            })}
          >
            {line}
          </div>
        ))}
      </label>
    </div>
  )
}
