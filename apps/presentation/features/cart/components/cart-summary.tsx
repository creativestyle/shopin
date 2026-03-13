'use client'

import type { CartResponse } from '@core/contracts/cart/cart'
import type { OrderResponse } from '@core/contracts/order/order'
import { PromoCodeSection } from './promo-code-section'
import { PriceRow } from './price-row'
import { CartTotalDisplay } from './cart-total-display'
import { Divider } from '@/components/ui/divider'
import { useTranslations, useLocale } from 'next-intl'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CartSummaryProps {
  cart: CartResponse | OrderResponse
  variant?: 'default' | 'modal' | 'checkout'
  className?: string
  actions?: ReactNode
  showPromoCode?: boolean
}

export function CartSummary({
  cart,
  variant = 'default',
  className,
  actions,
  showPromoCode = true,
}: CartSummaryProps) {
  const locale = useLocale()
  const t = useTranslations('cart')
  const shippingCents = cart.shippingInfo?.price.regularPriceInCents || 0

  const content = (
    <>
      {showPromoCode && (
        <>
          <PromoCodeSection label={t('summary.promoCode')} />
          <Divider />
        </>
      )}
      <div className='flex w-full flex-col items-start gap-2'>
        <PriceRow
          label={t('summary.subtotal')}
          value={cart.subtotal.regularPriceInCents}
          currency={cart.subtotal.currency ?? cart.currency}
          fractionDigits={cart.subtotal.fractionDigits ?? 2}
          locale={locale}
        />
        <PriceRow
          label={t('summary.shipping')}
          value={shippingCents}
          currency={cart.currency}
          fractionDigits={2}
          locale={locale}
        />
      </div>
      <Divider />
      <CartTotalDisplay
        total={cart.grandTotal.regularPriceInCents}
        currency={cart.grandTotal.currency ?? cart.currency}
        fractionDigits={cart.grandTotal.fractionDigits ?? 2}
      />
      {actions && (
        <>
          <Divider />
          {actions}
        </>
      )}
    </>
  )

  if (variant === 'modal') {
    return (
      <div
        className={cn(
          'flex w-full shrink-0 flex-col items-start gap-4 px-8 pt-4 pb-8',
          className
        )}
      >
        {content}
      </div>
    )
  }

  if (variant === 'checkout') {
    return (
      <div className={cn('flex w-full flex-col gap-4', className)}>
        {content}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'w-full rounded-lg border border-gray-100 bg-white',
        className
      )}
    >
      <div className='flex flex-col gap-4 p-4 lg:p-8'>{content}</div>
    </div>
  )
}
