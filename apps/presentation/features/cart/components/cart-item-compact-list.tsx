'use client'

import type { LineItemResponse } from '@core/contracts/cart/cart'
import { CartItemCompact } from './cart-item/cart-item-compact'

interface CartItemCompactListProps {
  items: LineItemResponse[]
}

export function CartItemCompactList({ items }: CartItemCompactListProps) {
  return (
    <div>
      {items.map((item) => (
        <CartItemCompact
          key={item.id}
          item={item}
          preview
        />
      ))}
    </div>
  )
}
