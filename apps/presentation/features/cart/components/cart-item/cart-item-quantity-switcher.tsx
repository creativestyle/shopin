'use client'

import type { LineItemResponse } from '@core/contracts/cart/cart'
import { QuantitySwitcher } from '@/components/ui/quantity-switcher/quantity-switcher'
import { useCartItemQuantity } from './use-cart-item-quantity'
import { useTranslations } from 'next-intl'

const MIN_QUANTITY = 1

interface CartItemQuantitySwitcherProps {
  item: LineItemResponse
  itemName: string
  onRemoveClick: () => void
  isRemoving?: boolean
  className?: string
}

export function CartItemQuantitySwitcher({
  item,
  itemName,
  onRemoveClick,
  isRemoving = false,
  className,
}: CartItemQuantitySwitcherProps) {
  const t = useTranslations('cart')
  const {
    optimisticQuantity,
    handleIncrease,
    handleDecrease,
    handleDirectInputChange,
  } = useCartItemQuantity({ item })

  // Only offer removal once the server quantity is at the minimum too
  const canRemove =
    item.quantity <= MIN_QUANTITY && optimisticQuantity <= MIN_QUANTITY

  return (
    <QuantitySwitcher
      value={optimisticQuantity}
      onDecrease={handleDecrease}
      onIncrease={handleIncrease}
      onChange={handleDirectInputChange}
      onRemove={canRemove ? onRemoveClick : undefined}
      removeLabel={t('item.removeNamed', { name: itemName })}
      disabled={isRemoving}
      min={MIN_QUANTITY}
      ariaLabel={t('item.quantityFor', { name: itemName })}
      className={className}
    />
  )
}
