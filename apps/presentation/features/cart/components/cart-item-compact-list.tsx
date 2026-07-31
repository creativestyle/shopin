'use client'

import type { LineItemResponse } from '@core/contracts/cart/cart'
import { CartItemCompact } from './cart-item/cart-item-compact'

interface CartItemCompactListProps {
  items: LineItemResponse[]
  /** Number of items to show before expanding. Omit to show all. */
  visibleCount?: number
  /** Controlled expand state. Defaults to true (show all). */
  isExpanded?: boolean
}

export function CartItemCompactList({
  items,
  visibleCount,
  isExpanded = true,
}: CartItemCompactListProps) {
  const hasLimit = visibleCount !== undefined && visibleCount < items.length
  const visibleItems =
    hasLimit && !isExpanded ? items.slice(0, visibleCount) : items
  const isCollapsed = hasLimit && !isExpanded

  return (
    <div>
      {visibleItems.map((item, index) => (
        <CartItemCompact
          key={item.id}
          item={item}
          preview
          isLast={isCollapsed && index === visibleItems.length - 1}
        />
      ))}
    </div>
  )
}
