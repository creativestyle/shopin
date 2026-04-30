import { notFound } from 'next/navigation'
import { getProductCollectionPage } from './get-product-collection-page'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { StandardContainer } from '@/components/ui/standard-container'
import { ErrorDisplay } from '@/components/ui/error-display'
import { ProductCollectionContent } from './product-collection-content'
import type { Filters } from '@core/contracts/product-collection/product-collection-page'
import { ITEMS_PER_PAGE, type SortOption } from '@config/constants'
import { getTranslations } from 'next-intl/server'
import { getCommonErrorMessage } from '@/lib/error-translation-keys'
import { HttpError } from '@/lib/error-utils'

interface ProductCollectionPageProps {
  slug: string
  locale: string
  page: number
  sort: SortOption
  filters?: Filters
  saleOnly?: boolean
  priceMin?: number
  priceMax?: number
}

export async function ProductCollectionPage({
  slug,
  locale,
  page,
  sort,
  filters,
  saleOnly = false,
  priceMin,
  priceMax,
}: ProductCollectionPageProps) {
  let productCollectionData = null
  let error: string | null = null

  try {
    productCollectionData = await getProductCollectionPage(
      slug,
      page,
      ITEMS_PER_PAGE,
      sort,
      filters,
      saleOnly,
      priceMin,
      priceMax
    )
  } catch (err) {
    if (HttpError.hasStatusCode(err, 404)) {
      notFound()
    }
    error = await getCommonErrorMessage(err, () => getTranslations('common'))
  }

  if (error) {
    return (
      <StandardContainer className='py-4'>
        <ErrorDisplay centered>{error}</ErrorDisplay>
      </StandardContainer>
    )
  }

  if (!productCollectionData) {
    notFound()
  }

  const totalPages = Math.ceil(productCollectionData.total / ITEMS_PER_PAGE)

  return (
    <StandardContainer className='py-4'>
      <Breadcrumbs
        crumbs={productCollectionData.breadcrumb}
        className='pb-4'
      />
      <ProductCollectionContent
        products={productCollectionData.productList}
        facets={productCollectionData.facets}
        priceRange={productCollectionData.priceRange}
        categoryTree={productCollectionData.categoryTree}
        currentCategoryId={productCollectionData.currentCategoryId}
        currentSort={sort}
        currentFilters={filters}
        currentPage={page}
        totalPages={totalPages}
        saleOnly={saleOnly}
        currentPriceMin={priceMin}
        currentPriceMax={priceMax}
        locale={locale}
      />
    </StandardContainer>
  )
}
