import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { LinkProps } from 'next/link'
import { cn } from '@/lib/utils'
import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import { PriceBox } from '@/components/ui/price/price-box'
import { ProductCardWishlistButton } from '@/features/wishlist/product-card-wishlist-button'
import { getProductHref } from '@/lib/product-utils'

interface ProductCardProps extends Omit<LinkProps, 'href' | 'className'> {
  data: ProductCardResponse
  className?: string
  locale: string
  actions?: React.ReactNode
  imagePreload?: boolean
  compact?: boolean
}

export const ProductCard: React.FC<ProductCardProps> = ({
  data,
  className,
  actions,
  locale,
  imagePreload,
  compact,
  ...props
}) => {
  const href = getProductHref(data.slug, data.variantId)

  return (
    <div
      className={cn(
        'group relative mx-auto flex w-full flex-col border-2 border-transparent bg-white transition-colors',
        'has-[:focus-visible]:border-gray-300 has-[:hover]:border-gray-300',
        className
      )}
    >
      <Link
        href={href}
        className='absolute inset-0 z-1 lord-of-the-focus-ring'
        {...props}
      />

      <div className={cn(
        'pointer-events-none relative w-full overflow-hidden',
        compact
          ? 'h-28 sm:h-32 md:h-40 lg:h-48'
          : 'h-44 sm:h-52 md:h-76 lg:min-h-110 lg:grow lg:basis-0'
      )}>
        <Image
          src={data.image.src}
          alt={data.image.alt || data.name}
          fill
          className='pointer-events-none absolute inset-0 h-full w-full max-w-none object-contain object-center'
          sizes='(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'
          preload={imagePreload}
          loading={imagePreload ? 'eager' : undefined}
          fetchPriority={imagePreload ? 'high' : undefined}
        />

        <div className='pointer-events-auto'>
          <ProductCardWishlistButton
            productId={data.id}
            variantId={data.variantId}
          />
        </div>
      </div>

      <div className='pointer-events-none relative flex w-full shrink-0 flex-col items-center gap-2 bg-white px-4 py-3 lg:gap-4 lg:p-4'>
        <div className='relative flex w-full shrink-0 flex-col items-center gap-2'>
          <div className='relative flex w-full shrink-0 flex-col items-center gap-1'>
            <p className='w-[min-content] min-w-full text-center text-sm/[1.1] font-bold text-gray-700'>
              {data.name}
            </p>
          </div>

          <div className='relative flex w-full shrink-0 items-start justify-center'>
            <PriceBox
              price={data.price}
              locale={locale}
              size='small'
              className='min-h-px min-w-px shrink-0 grow basis-0 text-center text-base/[1.6] font-bold text-gray-950'
            />
          </div>
        </div>
        {actions && (
          <div className='pointer-events-auto relative flex w-full shrink-0 flex-col gap-2'>
            {actions}
          </div>
        )}

        {!actions && (
          <div className='relative flex shrink-0 items-start gap-1 opacity-0 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-has-[>a:focus-visible]:opacity-100'></div>
        )}
        <div className='relative flex shrink-0 items-start gap-1 opacity-0 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-has-[>a:focus-visible]:opacity-100'></div>
      </div>
    </div>
  )
}
