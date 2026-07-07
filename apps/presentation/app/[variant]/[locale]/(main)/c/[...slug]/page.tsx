import { initRouteContext } from '@/lib/request-context/route-context'
import { ProductCollectionPage } from '@/features/productCollection/product-collection-page'
import { parsePlpSearchParams } from '@/features/productCollection/parse-search-params'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ variant: string; locale: string; slug: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { variant, locale, slug } = await params
  const search = await searchParams
  initRouteContext({ variant, locale })

  const slugString = Array.isArray(slug) ? slug.join('/') : slug
  const { page, sort, filters, saleOnly, priceMin, priceMax } =
    parsePlpSearchParams(search)

  return (
    <ProductCollectionPage
      locale={locale}
      slug={slugString}
      page={page}
      sort={sort}
      filters={filters}
      saleOnly={saleOnly}
      priceMin={priceMin}
      priceMax={priceMax}
    />
  )
}
