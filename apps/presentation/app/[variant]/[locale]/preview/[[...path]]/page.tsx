import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { initRouteContext } from '@/lib/request-context/route-context'
import {
  isPreviewTokenValid,
  PREVIEW_TOKEN_COOKIE,
  PREVIEW_TOKEN_INTERNAL_PARAM,
} from '@/lib/draft-mode'
import { HttpError } from '@/lib/error-utils'
import { getHomepageSlugForLocale } from '@/features/content/homepage-slug'
import { parsePlpSearchParams } from '@/features/productCollection/parse-search-params'
import { ContentPage } from '@/features/content/content-page'
import { getContentPage } from '@/features/content/get-content-page'
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

  if (!isPreviewTokenValid(asString(search[PREVIEW_TOKEN_INTERNAL_PARAM]))) {
    // The edge can only check the cookie's exp, not its HMAC signature (Node crypto can't
    // run in the edge bundle), so a forged/stale preview_token cookie routes every page
    // here. Tear the session down via /api/draft/exit — a Server Component can't clear an
    // HttpOnly cookie — and fall through to normal routing instead of dead-ending in a 404
    // the user can't escape until they clear cookies. With no cookie this is just a bad or
    // expired preview link → 404.
    const hasCookie = (await cookies()).has(PREVIEW_TOKEN_COOKIE)
    if (hasCookie) {
      const params = new URLSearchParams({ locale, slug: path.join('/') })
      redirect(`/api/draft/exit?${params.toString()}`)
    }
    notFound()
  }

  // Empty path = the homepage. Mirror the published homepage's slug resolution so an editor
  // clicking the logo mid-preview sees the draft homepage rather than a 404.
  if (!path.length) {
    return (
      <ContentPage
        slug={getHomepageSlugForLocale(locale)}
        isDraft
      />
    )
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

  // Any other path is a content slug. Functional routes (cart, account, …) get funneled here
  // under an active draft cookie but have no CMS entry, so resolve them to the 404 page rather
  // than rendering a soft "no content" message in the site chrome. Mirrors the published
  // catch-all guard in [...page]/page.tsx. getContentPage is request-cached, so ContentPage's
  // own fetch reuses this result.
  const slug = path.join('/')
  try {
    await getContentPage(slug, true)
  } catch (error) {
    // Only a genuine "no such page" (BFF 404) maps to notFound(). Transient BFF/Contentful
    // failures and schema-validation errors propagate to the error boundary so an editor sees a
    // diagnosable error rather than a misleading "page doesn't exist".
    if (HttpError.hasStatusCode(error, 404)) {
      notFound()
    }
    throw error
  }

  return (
    <ContentPage
      slug={slug}
      isDraft
    />
  )
}
