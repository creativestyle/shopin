import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ITEMS_PER_PAGE, MIN_PAGE } from '@config/constants'
import { initRouteContext } from '@/lib/request-context/route-context'
import { ProductCollectionPage } from '@/features/productCollection/product-collection-page'
import {
  parsePlpSearchParams,
  hasActiveRefinements,
} from '@/features/productCollection/parse-search-params'
import { getProductCollectionPage } from '@/features/productCollection/get-product-collection-page'
import { buildProductCollectionPageMetadata } from '@/features/productCollection/build-product-collection-page-metadata'
import { getSiteBaseUrl } from '@/lib/site-url'
import { logger } from '@/lib/logger'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ variant: string; locale: string; slug: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const [{ variant, locale, slug }, search] = await Promise.all([
    params,
    searchParams,
  ])
  initRouteContext({ variant, locale })
  const slugString = Array.isArray(slug) ? slug.join('/') : slug
  const parsed = parsePlpSearchParams(search)

  try {
    // Same (React-cached) request the render performs, so metadata reflects the
    // page actually shown — including its category name and total page count.
    const pageData = await getProductCollectionPage(
      slugString,
      parsed.page,
      ITEMS_PER_PAGE,
      parsed.sort,
      parsed.filters,
      parsed.saleOnly,
      parsed.priceMin,
      parsed.priceMax
    )
    const totalPages = Math.max(
      MIN_PAGE,
      Math.ceil(pageData.total / ITEMS_PER_PAGE)
    )
    const t = await getTranslations('pagination')

    return buildProductCollectionPageMetadata({
      pageData,
      slug: slugString,
      localePrefix: locale,
      baseUrl: getSiteBaseUrl(),
      page: parsed.page,
      totalPages,
      hasRefinements: hasActiveRefinements(parsed),
      pageLabel: t('pageOf', { currentPage: parsed.page, totalPages }),
    })
  } catch (error) {
    logger.error(
      {
        slug: slugString,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to build product collection page metadata'
    )
    // The page still renders (an error state, HTTP 200) — e.g. ?page=9999, which
    // exceeds the catalog's pagination limit and makes the BFF request fail. If we
    // cannot describe a page, it must not be indexed; follow keeps its links alive.
    return { robots: 'noindex, follow' }
  }
}

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
