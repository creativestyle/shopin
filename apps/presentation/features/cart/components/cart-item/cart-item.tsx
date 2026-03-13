'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { LineItemResponse } from '@core/contracts/cart/cart'
import { CartItemActions } from './cart-item-actions'
import { CartItemQuantitySwitcher } from './cart-item-quantity-switcher'
import { useLocale } from 'next-intl'
import { calculateItemPrices, getProductHref } from './cart-item-utils'
import { DecoratedPrice } from '@/components/ui/price/decorated-price'
import { CartItemRemovalConfirmation } from '../cart-item-removal-confirmation'
import { useCartItemRemoval } from '../../hooks/use-cart-item-removal'

interface CartItemProps {
  item: LineItemResponse
}

export function CartItem({ item }: CartItemProps) {
  const locale = useLocale()
  const productHref = getProductHref(item.productSlug)
  const { totalPrice, originalPrice } = calculateItemPrices(item)
  const {
    showConfirmation,
    isRemoving,
    handleRemoveClick,
    handleConfirm,
    handleCancel,
  } = useCartItemRemoval({ item })

  return (
    <div className='relative w-full border-b border-gray-100 py-6 md:h-72 md:py-8'>
      <div className='grid w-full grid-cols-[6rem_1fr] grid-rows-[1fr_auto] gap-4 md:h-full md:grid-cols-[11rem_1fr_auto] md:grid-rows-[auto_1fr_auto] md:gap-8'>
        {/* Product Image */}
        {item.imageUrl && (
          <div className='relative h-28 w-24 shrink-0 overflow-hidden md:row-span-3 md:h-56 md:w-44'>
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className='object-contain'
              sizes='(max-width: 768px) 90px, 169px'
            />
          </div>
        )}

        {/* Product Name */}
        <Link
          href={productHref}
          className='text-sm/[1.6] font-bold text-gray-950 hover:underline md:col-start-2 md:row-start-1 md:text-base'
        >
          {item.name}
        </Link>

        {/* Mobile: Actions, Quantity, Price Row - single grid cell with flex layout, sticks to bottom */}
        <div className='col-span-2 row-start-2 flex items-center gap-4 self-end md:contents'>
          {/* Actions - Mobile: in flex row | Desktop: row 3, col 2 */}
          <div className='md:col-start-2 md:row-start-3 md:self-end'>
            <div className='md:hidden'>
              <CartItemActions
                variant='icon-only'
                productId={item.productId}
                variantId={item.variantId}
                onRemoveClick={handleRemoveClick}
                isRemoving={isRemoving}
              />
            </div>
            <div className='hidden md:block'>
              <CartItemActions
                variant='with-text'
                productId={item.productId}
                variantId={item.variantId}
                onRemoveClick={handleRemoveClick}
                isRemoving={isRemoving}
              />
            </div>
          </div>

          {/* Quantity Switcher - Mobile: in flex row, centered | Desktop: row 1, col 3 */}
          <div className='flex min-w-0 flex-1 justify-center md:col-start-3 md:row-start-1 md:flex-none md:justify-self-end'>
            <CartItemQuantitySwitcher
              item={item}
              className='h-10'
            />
          </div>

          {/* Price - Mobile: in flex row, aligned to bottom | Desktop: row 3, col 3 */}
          <div className='flex h-full w-20 shrink-0 items-end justify-end text-right md:col-start-3 md:row-start-3 md:flex md:h-full md:w-auto md:items-end md:justify-end'>
            <DecoratedPrice
              price={totalPrice}
              originalPrice={originalPrice}
              currency={item.price.currency}
              fractionDigits={item.price.fractionDigits}
              locale={locale}
              variant={
                item.price.discountedPriceInCents ? 'discount' : 'regular'
              }
              className='text-sm font-bold md:text-base'
            />
          </div>
        </div>
      </div>
      {showConfirmation && (
        <CartItemRemovalConfirmation
          item={item}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isRemoving={isRemoving}
        />
      )}
    </div>
  )
}
