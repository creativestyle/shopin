'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useProductSearch } from './hooks/use-product-search'
import { ProductGrid } from '@/components/ui/product-grid'
import { ProductCollectionToolbarWrapper } from '@/features/productCollection/product-collection-toolbar-wrapper'
import { ActiveFilters } from '@/features/productCollection/active-filters'
import { useFilterState } from '@/features/productCollection/use-filter-params'
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

  return (
    <>
      <h1 className='mb-6 flex flex-col items-center text-center lg:block'>
        <span className='text-base font-normal text-gray-500'>
          {t('titlePrefix')}{' '}
        </span>
        <span className='text-[36px] font-normal text-gray-950'>
          &ldquo;{query}&rdquo;
        </span>
        {results && (
          <span className='text-base font-normal text-gray-500'>
            {' '}
            ({productCount} {t('articles')})
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

      {!results?.products.length && !isLoading ? (
        <div className='flex flex-col items-center gap-8 py-12 text-center'>
          <p className='text-[36px] font-normal text-gray-950'>
            {t('emptyTitle', { query })}
          </p>
          <p className='text-base text-gray-300'>{t('emptyMessage')}</p>
        </div>
      ) : results?.products.length ? (
        <div
          className={`transition-opacity duration-200 ${
            isLoading ? 'pointer-events-none opacity-50' : 'opacity-100'
          }`}
        >
          <ProductGrid
            products={results.products}
            locale={locale}
          />
        </div>
      ) : null}
    </>
  )
}
