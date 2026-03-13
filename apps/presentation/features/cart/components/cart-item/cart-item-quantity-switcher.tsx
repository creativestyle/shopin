'use client'

import type { LineItemResponse } from '@core/contracts/cart/cart'
import { QuantitySwitcher } from '@/components/ui/quantity-switcher/quantity-switcher'
import { useCartItemQuantity } from './use-cart-item-quantity'
import { useTranslations } from 'next-intl'

interface CartItemQuantitySwitcherProps {
  item: LineItemResponse
  className?: string
}

export function CartItemQuantitySwitcher({
  item,
  className,
}: CartItemQuantitySwitcherProps) {
  const t = useTranslations('cart')
  const {
    optimisticQuantity,
    handleIncrease,
    handleDecrease,
    handleDirectInputChange,
  } = useCartItemQuantity({ item })

  return (
    <QuantitySwitcher
      value={optimisticQuantity}
      onDecrease={handleDecrease}
      onIncrease={handleIncrease}
      onChange={handleDirectInputChange}
      ariaLabel={t('item.quantity')}
      className={className}
    />
  )
}
