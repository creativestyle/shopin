import { setRequestLocale } from 'next-intl/server'
import { ProductCollectionPage } from '@/features/productCollection/product-collection-page'
import { parsePlpSearchParams } from '@/features/productCollection/parse-search-params'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale, slug } = await params
  const search = await searchParams
  setRequestLocale(locale)

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
