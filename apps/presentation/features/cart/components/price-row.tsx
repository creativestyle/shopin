'use client'

import { FormattedPrice } from '@/components/ui/price/formatted-price'

interface PriceRowProps {
  label: string
  value: number
  currency: string
  fractionDigits: number
  locale: string
}

export function PriceRow({
  label,
  value,
  currency,
  fractionDigits,
  locale,
}: PriceRowProps) {
  return (
    <div className='flex w-full items-start justify-between leading-[1.6] whitespace-pre text-gray-950'>
      <p className='relative shrink-0 text-sm font-normal'>{label}</p>
      <div className='relative shrink-0 text-right text-base font-normal'>
        <FormattedPrice
          value={value}
          currency={currency}
          fractionDigits={fractionDigits}
          locale={locale}
          className='text-right text-base font-normal'
        />
      </div>
    </div>
  )
}
