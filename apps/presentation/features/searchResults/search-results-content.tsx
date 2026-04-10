'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useProductSearch } from './hooks/use-product-search'
import { ProductGrid } from '@/components/ui/product-grid'
import { PaginationWrapper } from '@/components/ui/pagination-wrapper'
import { ProductCollectionToolbarWrapper } from '@/features/productCollection/product-collection-toolbar-wrapper'
import { ActiveFilters } from '@/features/productCollection/active-filters'
import { useFilterState } from '@/features/productCollection/use-filter-params'
import { ITEMS_PER_PAGE, SEARCH_PARAM_PAGE, MIN_PAGE } from '@config/constants'

interface SearchResultsContentProps {
  locale: string
  query: string
}

export function SearchResultsContent({
  locale,
  query,
}: SearchResultsContentProps) {
  const t = useTranslations('searchResults')
  const searchParams = useSearchParams()
  const { currentSort, saleOnly, priceMin, priceMax, currentFilters } =
    useFilterState()

  const currentPage = Number(searchParams?.get(SEARCH_PARAM_PAGE)) || MIN_PAGE

  const searchOptions = useMemo(
    () => ({
      limit: ITEMS_PER_PAGE,
      page: currentPage,
      filters: currentFilters,
      priceMin,
      priceMax,
      sort: currentSort,
      saleOnly: saleOnly || undefined,
    }),
    [currentFilters, priceMin, priceMax, currentSort, saleOnly, currentPage]
  )

  const { results, isLoading } = useProductSearch(query, searchOptions)

  const productCount = results?.total ?? 0
  const totalPages = Math.ceil(productCount / ITEMS_PER_PAGE)

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

      {isLoading && !results && (
        <div className='flex justify-center py-12'>
          <span className='text-sm text-gray-500'>{t('loading')}</span>
        </div>
      )}

      {!isLoading && results && !results.products.length && (
        <div className='flex flex-col items-center gap-8 py-12 text-center'>
          <p className='text-[36px] font-normal text-gray-950'>
            {t('emptyTitle', { query })}
          </p>
          <p className='text-base text-gray-300'>{t('emptyMessage')}</p>
        </div>
      )}

      {results && results.products.length > 0 && (
        <div
          className={`transition-opacity duration-200 ${
            isLoading ? 'pointer-events-none opacity-50' : 'opacity-100'
          }`}
        >
          <ProductGrid
            products={results.products}
            locale={locale}
          />
          {totalPages > 1 && (
            <PaginationWrapper
              currentPage={currentPage}
              totalPages={totalPages}
              className='my-12'
            />
          )}
        </div>
      )}
    </>
  )
}
