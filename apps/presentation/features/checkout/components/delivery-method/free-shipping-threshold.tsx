'use client'

import { useLocale, useTranslations } from 'next-intl'
import { formatPriceWithPrefix } from '@/lib/price-formatter'

interface FreeShippingThresholdProps {
  amountInCents: number
  currency: string
  fractionDigits?: number
  className?: string
}

export function FreeShippingThreshold({
  amountInCents,
  currency,
  fractionDigits,
  className = 'text-xs/[1.6] text-gray-500',
}: FreeShippingThresholdProps) {
  const locale = useLocale()
  const t = useTranslations('checkout.deliveryMethod')

  return (
    <div className={className}>
      {t('freeShippingThreshold', {
        amount: formatPriceWithPrefix(amountInCents, locale, {
          currency,
          fractionDigits,
        }),
      })}
    </div>
  )
}
