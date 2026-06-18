import { notFound } from 'next/navigation'
import { initRouteContext } from '@/lib/request-context/route-context'
import {
  isPreviewTokenValid,
  PREVIEW_TOKEN_INTERNAL_PARAM,
} from '@/lib/draft-mode'
import { parsePlpSearchParams } from '@/features/productCollection/parse-search-params'
import { ContentPage } from '@/features/content/content-page'
import { ProductPage } from '@/features/product/product-page'
import { ProductCollectionPage } from '@/features/productCollection/product-collection-page'
export const dynamic = 'force-dynamic'

const asString = (v: string | string[] | undefined) =>
  typeof v === 'string' ? v : undefined

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ variant: string; locale: string; path?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ variant, locale, path = [] }, search] = await Promise.all([
    params,
    searchParams,
  ])
  initRouteContext({ variant, locale })

  if (!path.length) {
    notFound()
  }

  if (!isPreviewTokenValid(asString(search[PREVIEW_TOKEN_INTERNAL_PARAM]))) {
    notFound()
  }

  if (path[0] === 'p') {
    const slug = path.slice(1).join('/')
    if (!slug) {
      notFound()
    }
    return (
      <ProductPage
        slug={slug}
        locale={locale}
        variantId={asString(search.variantId)}
        isDraft
      />
    )
  }

  if (path[0] === 'c') {
    const slug = path.slice(1).join('/')
    if (!slug) {
      notFound()
    }
    const { page, sort, filters, saleOnly, priceMin, priceMax } =
      parsePlpSearchParams(search)
    return (
      <ProductCollectionPage
        slug={slug}
        locale={locale}
        page={page}
        sort={sort}
        filters={filters}
        saleOnly={saleOnly}
        priceMin={priceMin}
        priceMax={priceMax}
        isDraft
      />
    )
  }

  return (
    <ContentPage
      slug={path.join('/')}
      isDraft
    />
  )
}
