import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { isPreviewTokenValid, PREVIEW_TOKEN_COOKIE } from '@/lib/draft-mode'
import { parsePlpSearchParams } from '@/features/productCollection/parse-search-params'
import { ContentPage } from '@/features/content/content-page'
import { ProductPage } from '@/features/product/product-page'
import { ProductCollectionPage } from '@/features/productCollection/product-collection-page'

export const dynamic = 'force-dynamic'

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; path: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale, path } = await params
  setRequestLocale(locale)

  const cookieStore = await cookies()
  const token = cookieStore.get(PREVIEW_TOKEN_COOKIE)?.value
  if (!isPreviewTokenValid(token)) {
    notFound()
  }

  // Product page: path starts with 'p'
  if (path[0] === 'p') {
    const slug = path.slice(1).join('/')
    const search = await searchParams
    const variantId =
      typeof search.variantId === 'string' ? search.variantId : undefined
    return (
      <ProductPage
        slug={slug}
        locale={locale}
        variantId={variantId}
        isDraft
      />
    )
  }

  // Category page: path starts with 'c'
  if (path[0] === 'c') {
    const slug = path.slice(1).join('/')
    const search = await searchParams
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

  // CMS page: everything else
  const slug = path.join('/')
  return (
    <ContentPage
      slug={slug}
      isDraft
    />
  )
}
