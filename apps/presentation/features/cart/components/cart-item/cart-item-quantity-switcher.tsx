'use client'

import type { LineItemResponse } from '@core/contracts/cart/cart'
import { QuantitySwitcher } from '@/components/ui/quantity-switcher/quantity-switcher'
import { useCartItemQuantity } from './use-cart-item-quantity'
import { useRemoveCartItem } from '../../hooks/use-remove-cart-item'
import { useTranslations } from 'next-intl'

interface CartItemQuantitySwitcherProps {
  item: LineItemResponse
  itemName: string
  className?: string
}

export function CartItemQuantitySwitcher({
  item,
  itemName,
  className,
}: CartItemQuantitySwitcherProps) {
  const t = useTranslations('cart')
  const {
    optimisticQuantity,
    handleIncrease,
    handleDecrease,
    handleDirectInputChange,
  } = useCartItemQuantity({ item })
  const { handleRemove, isPending: isRemoving } = useRemoveCartItem()

  const handleRemoveAtZero = () => {
    handleRemove({ lineItemId: item.id }).catch(() => {})
  }

  return (
    <QuantitySwitcher
      value={optimisticQuantity}
      onDecrease={handleDecrease}
      onIncrease={handleIncrease}
      onChange={handleDirectInputChange}
      onRemove={handleRemoveAtZero}
      removeLabel={t('item.removeNamed', { name: itemName })}
      disabled={isRemoving}
      ariaLabel={t('item.quantityFor', { name: itemName })}
      className={className}
    />
  )
}
