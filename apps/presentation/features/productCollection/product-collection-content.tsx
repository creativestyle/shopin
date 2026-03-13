'use client'

import { useSyncExternalStore, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { ProductCollectionToolbarWrapper } from './product-collection-toolbar-wrapper'
import { ProductGrid } from '@/components/ui/product-grid'
import { PaginationWrapper } from '@/components/ui/pagination-wrapper'
import { ActiveFilters } from './components/active-filters'
import { CategoryTree } from './components/category-tree'
import type { SortOption } from '@config/constants'
import type {
  CategoryTreeNode,
  PriceRange,
} from '@core/contracts/product-collection/product-collection'
import type { Facet } from '@core/contracts/product-collection/facet'
import type { Filters } from '@core/contracts/product-collection/product-collection-page'
import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'

interface ProductCollectionContentProps {
  products: ProductCardResponse[]
  facets?: Facet[]
  priceRange?: PriceRange
  categoryTree?: CategoryTreeNode[]
  currentCategoryId?: string
  currentSort: SortOption
  currentFilters?: Filters
  currentPage: number
  totalPages: number
  saleOnly?: boolean
  currentPriceMin?: number
  currentPriceMax?: number
  locale: string
}

export function ProductCollectionContent({
  products,
  facets,
  priceRange,
  categoryTree,
  currentCategoryId,
  currentSort,
  currentFilters,
  currentPage,
  totalPages,
  saleOnly,
  currentPriceMin,
  currentPriceMax,
  locale,
}: ProductCollectionContentProps) {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener('storage', callback)
    return () => window.removeEventListener('storage', callback)
  }, [])
  const showCategories = useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem('showCategories') === 'true',
    () => false
  )
  const setShowCategories = useCallback((value: boolean) => {
    sessionStorage.setItem('showCategories', value.toString())
    window.dispatchEvent(new StorageEvent('storage'))
  }, [])
  const t = useTranslations('productCollection')

  return (
    <>
      <ProductCollectionToolbarWrapper
        currentSort={currentSort}
        facets={facets}
        currentFilters={currentFilters}
        saleOnly={saleOnly}
        priceRange={priceRange}
        currentPriceMin={currentPriceMin}
        currentPriceMax={currentPriceMax}
        showCategoriesButton={!!categoryTree && categoryTree.length > 0}
        showCategories={showCategories}
        onToggleCategories={() => setShowCategories(!showCategories)}
        className='mb-4'
      />
      <div className='flex gap-6'>
        {showCategories && categoryTree && categoryTree.length > 0 && (
          <CategoryTree
            categories={categoryTree}
            currentCategoryId={currentCategoryId}
          />
        )}
        <div className='flex-1'>
          <ActiveFilters
            facets={facets}
            saleOnly={saleOnly}
            currentPriceMin={currentPriceMin}
            currentPriceMax={currentPriceMax}
          />
          {products.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-24 text-center'>
              <p className='mb-2 text-lg font-bold text-gray-950'>
                {t('filters.noResultsTitle' as Parameters<typeof t>[0])}
              </p>
              <p className='text-sm text-gray-500'>
                {t('filters.noResultsMessage' as Parameters<typeof t>[0])}
              </p>
            </div>
          ) : (
            <ProductGrid
              products={products}
              locale={locale}
            />
          )}
          {totalPages > 1 && (
            <PaginationWrapper
              currentPage={currentPage}
              totalPages={totalPages}
              className='my-12'
            />
          )}
        </div>
      </div>
    </>
  )
}
