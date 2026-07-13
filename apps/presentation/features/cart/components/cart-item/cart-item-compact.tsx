'use client'

import Image from 'next/image'
import { Link } from '@/lib/navigation'
import { productImageLoader } from '@/lib/product-image-loader'
import type { LineItemResponse } from '@core/contracts/cart/cart'
import { CartItemActions } from './cart-item-actions'
import { CartItemQuantitySwitcher } from './cart-item-quantity-switcher'
import { cn } from '@/lib/utils'
import { useLocale, useTranslations } from 'next-intl'
import { calculateItemPrices, getProductHref } from './cart-item-utils'
import { DecoratedPrice } from '@/components/ui/price/decorated-price'
import { CartItemRemovalConfirmation } from '../cart-item-removal-confirmation'
import { useCartItemRemoval } from '../../hooks/use-cart-item-removal'

interface CartItemCompactProps {
  item: LineItemResponse
  preview?: boolean
  /** Removes bottom border — use for the last item when list is collapsed. */
  isLast?: boolean
}

export function CartItemCompact({
  item,
  preview = false,
  isLast = false,
}: CartItemCompactProps) {
  const locale = useLocale()
  const t = useTranslations('cart')
  const productHref = getProductHref(item.productSlug)
  const { totalPrice, originalPrice } = calculateItemPrices(item)
  const {
    showConfirmation,
    isRemoving,
    handleRemoveClick,
    handleConfirm,
    handleCancel,
  } = useCartItemRemoval({ item })

  const isDiscounted = Boolean(item.price.discountedPriceInCents)

  const priceClassName = cn(
    'shrink-0 text-sm font-bold',
    preview && 'md:text-base',
    isDiscounted ? 'text-red-600' : 'text-gray-950'
  )

  const originalPriceClassName = preview
    ? 'text-xs/[1.6] md:text-sm/[1.6] text-gray-500'
    : 'text-xs/[1.6] text-gray-500'

  return (
    <div
      className={cn(
        'relative w-full shrink-0 border-gray-100',
        !isLast && 'border-b'
      )}
    >
      <div className='flex w-full flex-col gap-2.5 overflow-clip px-0 py-6'>
        <div className='flex w-full items-stretch gap-4'>
          <div className='flex shrink-0 flex-col justify-between self-stretch'>
            {item.imageUrl && (
              <div className='relative h-28 w-24 shrink-0 overflow-hidden'>
                <Image
                  loader={productImageLoader(item.imageUrl)}
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className='object-contain'
                  sizes='90px'
                />
              </div>
            )}
            {!preview && (
              <CartItemActions
                variant='icon-only'
                productId={item.productId}
                variantId={item.variantId}
                onRemoveClick={handleRemoveClick}
                isRemoving={isRemoving}
              />
            )}
          </div>
          <div className='flex min-w-0 flex-1 flex-col justify-between gap-4'>
            {preview ? (
              <div className='flex items-start justify-between gap-4'>
                <Link
                  href={productHref}
                  className='text-sm/[1.6] font-bold text-gray-950 hover:underline'
                >
                  {item.name}
                </Link>
                <DecoratedPrice
                  price={totalPrice}
                  originalPrice={originalPrice}
                  currency={item.price.currency}
                  fractionDigits={item.price.fractionDigits}
                  locale={locale}
                  wrapperClassName='flex-col items-end gap-0'
                  className={priceClassName}
                  originalPriceClassName={originalPriceClassName}
                />
              </div>
            ) : (
              <Link
                href={productHref}
                className='text-sm/[1.6] font-bold text-gray-950 hover:underline'
              >
                {item.name}
              </Link>
            )}
            <div className='flex w-full flex-row items-center justify-between gap-2'>
              {preview ? (
                <div className='text-sm text-gray-700'>
                  {t('item.quantity')}: {item.quantity}
                </div>
              ) : (
                <CartItemQuantitySwitcher
                  item={item}
                  className='h-10 shrink-0'
                />
              )}
              {!preview && (
                <DecoratedPrice
                  price={totalPrice}
                  originalPrice={originalPrice}
                  currency={item.price.currency}
                  fractionDigits={item.price.fractionDigits}
                  locale={locale}
                  wrapperClassName='flex-col items-end gap-0'
                  className={priceClassName}
                  originalPriceClassName={originalPriceClassName}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {isLast && (
        <div className='pointer-events-none absolute right-0 bottom-0 left-0 h-[59px] bg-gradient-to-t from-white to-transparent' />
      )}
      {!preview && showConfirmation && (
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
