'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useProductSearch } from '@/hooks/use-product-search'
import { ProductGrid } from '@/components/ui/product-grid'
import { ProductCollectionToolbarWrapper } from '@/features/productCollection/product-collection-toolbar-wrapper'
import { ActiveFilters } from '@/features/productCollection/components/active-filters'
import { useFilterState } from '@/features/productCollection/hooks/use-filter-params'
import { ITEMS_PER_PAGE } from '@config/constants'

interface SearchResultsContentProps {
  locale: string
  query: string
}

const SEARCH_RESULTS_LIMIT = ITEMS_PER_PAGE

export function SearchResultsContent({
  locale,
  query,
}: SearchResultsContentProps) {
  const t = useTranslations('searchResults')
  const { currentSort, saleOnly, priceMin, priceMax, currentFilters } =
    useFilterState()

  const searchOptions = useMemo(
    () => ({
      limit: SEARCH_RESULTS_LIMIT,
      filters: currentFilters,
      priceMin,
      priceMax,
      sort: currentSort,
      saleOnly: saleOnly || undefined,
    }),
    [currentFilters, priceMin, priceMax, currentSort, saleOnly]
  )

  const { results, isLoading } = useProductSearch(query, searchOptions)

  const productCount = results?.total ?? results?.products.length ?? 0
  const countLabel = productCount === 1 ? t('result') : t('results')

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

      <ProductCollectionToolbarWrapper
        currentSort={currentSort}
        facets={results?.facets}
        currentFilters={currentFilters}
        saleOnly={saleOnly}
        priceRange={results?.priceRange}
        currentPriceMin={priceMin}
        currentPriceMax={priceMax}
        showCategoriesButton={false}
        className='mb-4'
      />

      <ActiveFilters
        facets={results?.facets}
        saleOnly={saleOnly}
        currentPriceMin={priceMin}
        currentPriceMax={priceMax}
      />

      {isLoading ? (
        <div className='py-12 text-center'>
          <p className='text-muted-foreground'>{t('loading')}</p>
        </div>
      ) : !results?.products.length ? (
        <div className='py-12 text-center'>
          <p className='text-muted-foreground'>{t('emptyMessage')}</p>
        </div>
      ) : (
        <ProductGrid
          products={results.products}
          locale={locale}
        />
      )}
    </>
  )
}
