'use client'

import { FormattedPrice } from '@/components/ui/price/formatted-price'

interface PriceRowProps {
  label: string
  value?: number
  currency: string
  fractionDigits: number
  locale: string
  placeholder?: string
}

export function PriceRow({
  label,
  value,
  currency,
  fractionDigits,
  locale,
  placeholder,
}: PriceRowProps) {
  if (value === undefined && placeholder === undefined) {
    return null
  }

  return (
    <div className='flex w-full items-start justify-between gap-4 leading-[1.6] text-gray-950'>
      <p className='relative shrink-0 text-sm font-normal whitespace-pre'>
        {label}
      </p>
      <div className='relative min-w-0 text-right text-base font-normal'>
        {value === undefined ? (
          <p className='text-right text-sm font-normal text-gray-500'>
            {placeholder}
          </p>
        ) : (
          <FormattedPrice
            value={value}
            currency={currency}
            fractionDigits={fractionDigits}
            locale={locale}
            className='text-right text-base font-normal'
          />
        )}
      </div>
    </div>
  )
}
