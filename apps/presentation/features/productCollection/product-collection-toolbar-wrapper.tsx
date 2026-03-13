'use client'

import dynamic from 'next/dynamic'
import type { Facet } from '@core/contracts/product-collection/facet'
import type { Filters } from '@core/contracts/product-collection/product-collection-page'
import type { PriceRange } from '@core/contracts/product-collection/product-collection'
import type { SortOption } from '@config/constants'
import { cn } from '@/lib/utils'
import { useHasMounted } from '@/hooks/use-has-mounted'

const ProductCollectionToolbar = dynamic(
  () =>
    import('./product-collection-toolbar').then(
      (mod) => mod.ProductCollectionToolbar
    ),
  { ssr: false }
)

interface ProductCollectionToolbarWrapperProps {
  currentSort: SortOption
  facets?: Facet[]
  currentFilters?: Filters
  saleOnly?: boolean
  priceRange?: PriceRange
  currentPriceMin?: number
  currentPriceMax?: number
  showCategoriesButton?: boolean
  showCategories?: boolean
  onToggleCategories?: () => void
  className?: string
}

export function ProductCollectionToolbarWrapper(
  props: ProductCollectionToolbarWrapperProps
) {
  const isMounted = useHasMounted()
  const { className, ...toolbarProps } = props

  return (
    <div
      className={cn(
        'relative flex h-16 w-full items-center transition-opacity duration-150',
        'before:absolute before:top-0 before:left-1/2 before:h-px before:w-[100cqw] before:-translate-x-1/2 before:bg-gray-100',
        'after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-[100cqw] after:-translate-x-1/2 after:bg-gray-100',
        isMounted ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      <ProductCollectionToolbar
        {...toolbarProps}
        className='w-full'
      />
    </div>
  )
}
