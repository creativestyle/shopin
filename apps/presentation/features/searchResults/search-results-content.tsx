'use client'

import { useTranslations } from 'next-intl'
import { useProductSearch } from '@/hooks/use-product-search'
import { ProductCard } from '@/components/ui/product-card'
import { AddToCart } from '@/features/cart/cart-add-to-cart'

interface SearchResultsContentProps {
  locale: string
  query: string
}

const SEARCH_RESULTS_LIMIT = 100

export function SearchResultsContent({
  locale,
  query,
}: SearchResultsContentProps) {
  const t = useTranslations('searchResults')
  const { results, isLoading } = useProductSearch(query, SEARCH_RESULTS_LIMIT)

  const productCount = results?.products.length ?? 0
  const countLabel =
    productCount === 1 ? t('result') : t('results')

  return (
    <>
      <h1 className='mb-6 text-center text-[36px] font-normal'>
        {t('title')}{' '}
        {!isLoading && results && (
          <span className='text-base font-normal'>
            ({productCount} {countLabel})
          </span>
        )}
      </h1>

      {isLoading ? (
        <div className='py-12 text-center'>
          <p className='text-muted-foreground'>{t('loading')}</p>
        </div>
      ) : !results?.products.length ? (
        <div className='py-12 text-center'>
          <p className='text-muted-foreground'>{t('emptyMessage')}</p>
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-8'>
          {results.products.map((product) => (
            <ProductCard
              key={product.id}
              data={product}
              locale={locale}
              actions={
                <AddToCart
                  productId={product.id}
                  productSlug={product.slug}
                  productName={product.name}
                  variantId={product.variantId}
                  variantCount={product.variantCount}
                  variant='primary'
                  className='z-2 w-full'
                  showLoadingText
                />
              }
            />
          ))}
        </div>
      )}
    </>
  )
}
