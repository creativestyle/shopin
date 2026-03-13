'use client'

import { useLocale, useTranslations } from 'next-intl'
import { formatPriceWithPrefix } from '@/lib/price-formatter'
import { useFreeShippingThreshold } from '../../hooks/use-free-shipping-threshold'
import { cn } from '@/lib/utils'
import { FreeShippingThreshold } from './free-shipping-threshold'

interface DeliveryMethodLabelProps {
  name: string
  priceInCents: number
  currency: string
  fractionDigits?: number
  freeAboveInCents?: number
  freeAboveCurrency?: string
  freeAboveFractionDigits?: number
  className?: string
  variant?: 'item' | 'preview'
}

export function DeliveryMethodLabel({
  name,
  priceInCents,
  currency,
  fractionDigits,
  freeAboveInCents,
  freeAboveCurrency,
  freeAboveFractionDigits,
  className,
  variant = 'item',
}: DeliveryMethodLabelProps) {
  const locale = useLocale()
  const t = useTranslations('checkout.deliveryMethod')

  const { isFree, hasFreeShippingThreshold } = useFreeShippingThreshold({
    priceInCents,
    freeAboveInCents,
  })

  const priceText = isFree
    ? t('free')
    : `+${formatPriceWithPrefix(priceInCents, locale, {
        currency,
        fractionDigits,
      })}`

  const isPreview = variant === 'preview'

  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        {
          'flex-1 cursor-pointer': !isPreview,
        },
        className
      )}
    >
      <div
        className={cn('flex flex-col gap-1', {
          'lg:flex-row lg:items-center lg:justify-between lg:gap-3': !isPreview,
        })}
      >
        <span className='text-sm/[1.6] text-gray-700'>{name}</span>
        <span
          className={cn({
            'text-sm font-medium text-gray-700': isPreview,
            'shrink-0 text-base/[1.6] font-bold text-nowrap text-gray-950':
              !isPreview,
          })}
        >
          {priceText}
        </span>
      </div>
      {hasFreeShippingThreshold && freeAboveInCents && freeAboveCurrency && (
        <FreeShippingThreshold
          amountInCents={freeAboveInCents}
          currency={freeAboveCurrency}
          fractionDigits={freeAboveFractionDigits}
        />
      )}
    </div>
  )
}
