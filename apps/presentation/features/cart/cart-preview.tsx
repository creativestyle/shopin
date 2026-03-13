'use client'

import * as React from 'react'
import type { CartResponse } from '@core/contracts/cart/cart'
import type { OrderResponse } from '@core/contracts/order/order'
import { CartSummary } from './components/cart-summary'
import { CartItemCompactList } from './components/cart-item-compact-list'
import { ShowMoreProducts } from './components/show-more-products'

interface CartPreviewProps {
  /** Cart (e.g. checkout steps) or order (e.g. thank you page) */
  cart: CartResponse | OrderResponse
  /** Show promo code section. Default false for thank you page. */
  showPromoCode?: boolean
  className?: string
  /**
   * When true (e.g. checkout steps), line items are in a scrollable area with "show more" indicator.
   * When false/omitted, simple non-scrollable list (e.g. thank you page).
   */
  scrollable?: boolean
}

/**
 * Whole cart/order preview: products (line items) + optional show more + price summary.
 * Exported from cart feature for use in checkout steps and thank you page.
 */
export function CartPreview({
  cart,
  showPromoCode = false,
  className,
  scrollable = false,
}: CartPreviewProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  const lineItems = cart.lineItems ?? []
  const hasScroll = scrollable

  return (
    <div className={className}>
      {/* Products */}
      {hasScroll && scrollRef && sentinelRef ? (
        <div
          ref={scrollRef}
          className='flex-1 overflow-y-auto px-6'
        >
          <CartItemCompactList items={lineItems} />
          <div
            ref={sentinelRef}
            className='h-0 w-full'
          />
        </div>
      ) : (
        <CartItemCompactList items={lineItems} />
      )}

      {/* Show more products */}
      {hasScroll && scrollRef && sentinelRef && (
        <div className='shrink-0 px-6'>
          <ShowMoreProducts
            scrollRef={scrollRef}
            sentinelRef={sentinelRef}
          />
        </div>
      )}

      {/* Price summary */}
      <div className={hasScroll ? 'shrink-0 p-6 pt-6' : 'pt-4'}>
        <CartSummary
          cart={cart}
          variant='checkout'
          showPromoCode={showPromoCode}
        />
      </div>
    </div>
  )
}
