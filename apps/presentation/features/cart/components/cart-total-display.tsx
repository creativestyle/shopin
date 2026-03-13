'use client'

import { FormattedPrice } from '@/components/ui/price/formatted-price'
import { useTranslations, useLocale } from 'next-intl'

interface CartTotalDisplayProps {
  total: number
  currency: string
  fractionDigits: number
}

export function CartTotalDisplay({
  total,
  currency,
  fractionDigits,
}: CartTotalDisplayProps) {
  const locale = useLocale()
  const t = useTranslations('cart')
  const displayLabel = t('summary.total')
  const taxNote = t('summary.taxNote')

  return (
    <div className='relative flex w-full shrink-0 flex-wrap content-center items-center justify-between gap-2'>
      <div className='relative flex min-h-px min-w-px shrink-0 grow basis-0 flex-wrap content-center items-center gap-1 text-sm text-nowrap whitespace-pre'>
        <p className='relative shrink-0 leading-[1.1] font-bold text-gray-950'>
          {displayLabel}
        </p>
        <p className='relative shrink-0 leading-[1.6] font-normal text-gray-500'>
          ({taxNote})
        </p>
      </div>
      <div className='relative h-7 min-h-px min-w-px shrink-0 grow basis-0 text-right text-base/[1.6] font-bold text-gray-950'>
        <FormattedPrice
          value={total}
          currency={currency}
          fractionDigits={fractionDigits}
          locale={locale}
          className='text-right text-base font-bold text-gray-950'
        />
      </div>
    </div>
  )
}
