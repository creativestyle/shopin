'use client'

import { useWishlist } from './wishlist-use-wishlist'
import { useTranslations } from 'next-intl'
import { WishlistHeader } from './wishlist-header'
import { PaginationWrapper } from '@/components/ui/pagination-wrapper'
import { ITEMS_PER_PAGE } from '@config/constants'
import { ProductCard } from '@/components/ui/product-card'
import { AddToCart } from '@/features/cart/cart-add-to-cart'

interface WishlistContentProps {
  locale: string
  page: number
}

/**
 * Client component that displays wishlist content with real-time updates and pagination.
 * Uses React Query to automatically refresh when items are added/removed.
 */
export function WishlistContent({ locale, page }: WishlistContentProps) {
  const t = useTranslations('wishlist')
  const { wishlist, isLoading } = useWishlist({ page, limit: ITEMS_PER_PAGE })

  const itemCount = wishlist?.itemCount || 0
  const totalPages = Math.ceil(itemCount / ITEMS_PER_PAGE)

  return (
    <>
      <WishlistHeader
        title={t('title')}
        serverItemCount={itemCount}
        itemLabel={t('item')}
        itemsLabel={t('items')}
      />

      {isLoading ? (
        <div className='py-12 text-center'>
          <p className='text-muted-foreground'>{t('loading')}</p>
        </div>
      ) : !wishlist?.items.length ? (
        <div className='py-12 text-center'>
          <p className='text-muted-foreground'>{t('emptyMessage')}</p>
        </div>
      ) : (
        <>
          <div className='grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-8'>
            {wishlist.items.map((item) => (
              <ProductCard
                key={item.id}
                data={item.product}
                locale={locale}
                actions={
                  <AddToCart
                    productId={item.product.id}
                    productSlug={item.product.slug}
                    productName={item.product.name}
                    variantId={item.product.variantId}
                    variantCount={item.product.variantCount}
                    variant='primary'
                    className='z-2 w-full'
                    showLoadingText
                  />
                }
              />
            ))}
          </div>

          {totalPages > 1 && (
            <PaginationWrapper
              currentPage={page}
              totalPages={totalPages}
              className='mt-8'
            />
          )}
        </>
      )}
    </>
  )
}
