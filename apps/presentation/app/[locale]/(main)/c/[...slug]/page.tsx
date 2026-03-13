import { ProductCollectionPage } from '@/features/productCollection/product-collection-page'
import {
  FiltersSchema,
  SaleOnlySchema,
  PriceMinSchema,
  PriceMaxSchema,
  SortSchema,
} from '@core/contracts/product-collection/product-collection-page'
import {
  MIN_PAGE,
  DEFAULT_SORT_OPTION,
  type SortOption,
} from '@config/constants'

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>
  searchParams: Promise<{
    page?: string
    sort?: string
    filters?: string
    saleOnly?: string
    priceMin?: string
    priceMax?: string
  }>
}

export default async function Page({ params, searchParams }: PageProps) {
  const [
    { locale, slug },
    {
      page,
      sort,
      filters: filtersParam,
      saleOnly: saleOnlyParam,
      priceMin: priceMinParam,
      priceMax: priceMaxParam,
    },
  ] = await Promise.all([params, searchParams])
  const slugString = Array.isArray(slug) ? slug.join('/') : slug
  const parsedPage = page ? parseInt(page, 10) : MIN_PAGE
  const currentPage =
    !isNaN(parsedPage) && parsedPage >= MIN_PAGE ? parsedPage : MIN_PAGE

  const sortResult = SortSchema.safeParse(sort)
  const currentSort: SortOption = sortResult.success
    ? sortResult.data
    : DEFAULT_SORT_OPTION

  const filtersResult = FiltersSchema.safeParse(filtersParam)
  const filters = filtersResult.success ? filtersResult.data : undefined

  const saleOnly = SaleOnlySchema.parse(saleOnlyParam)

  const priceMinResult = PriceMinSchema.safeParse(priceMinParam)
  const priceMin = priceMinResult.success ? priceMinResult.data : undefined

  const priceMaxResult = PriceMaxSchema.safeParse(priceMaxParam)
  const priceMax = priceMaxResult.success ? priceMaxResult.data : undefined

  return (
    <ProductCollectionPage
      locale={locale}
      slug={slugString}
      page={currentPage}
      sort={currentSort}
      filters={filters}
      saleOnly={saleOnly}
      priceMin={priceMin}
      priceMax={priceMax}
    />
  )
}
