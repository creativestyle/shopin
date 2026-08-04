import type { Metadata } from 'next'
import type { ProductCollectionPageResponse } from '@core/contracts/product-collection/product-collection-page'
import {
  CATEGORY_PATH_PREFIX,
  SEARCH_PARAM_PAGE,
  MIN_PAGE,
} from '@config/constants'
import { buildCanonicalUrl, buildHreflangLanguages } from '@/lib/site-url'
import { DEFAULT_OG_IMAGE, SITE_NAME } from '@/features/seo/site-metadata'

export interface BuildProductCollectionPageMetadataParams {
  pageData: ProductCollectionPageResponse
  /** Category slug from the route (used when the collection has no name). */
  slug: string
  localePrefix: string
  baseUrl: string | undefined
  /** Current page number from the `page` search param. */
  page: number
  /** Total pages available for the current result set (at least MIN_PAGE). */
  totalPages: number
  /** True when any filter/sort/price/sale refinement is active. */
  hasRefinements: boolean
  /** Translated page indicator appended to the title on page 2+, e.g. "Page 2 of 5". */
  pageLabel?: string
}

/**
 * Build Next.js metadata for the PLP.
 *
 * Duplicate-content rules, the reason this template needed metadata most:
 *  - Clean category URL and paginated pages get a *self-referencing* canonical
 *    (`?page=N` preserved), which is what Google asks for on paginated series.
 *  - Refined URLs (filters, sort, price, sale-only) are `noindex, follow`: they are
 *    near-infinite combinations of the same products. They stay crawlable — so the
 *    directive is actually seen — and canonicalise to the clean category URL.
 *  - hreflang is emitted only for the unrefined first page, the one URL per locale
 *    that is meant to be indexed.
 *  - Pages past the end of the result set (?page=9999, which crawlers do try) are
 *    empty and get the refined treatment: noindex, and canonical back to page 1.
 */
export function buildProductCollectionPageMetadata({
  pageData,
  slug,
  localePrefix,
  baseUrl,
  page,
  totalPages,
  hasRefinements,
  pageLabel,
}: BuildProductCollectionPageMetadataParams): Metadata {
  const { seo } = pageData
  const isOutOfRangePage = page > totalPages
  const isIndexableUrl = !hasRefinements && !isOutOfRangePage

  const categoryUrl = baseUrl
    ? buildCanonicalUrl(baseUrl, localePrefix, CATEGORY_PATH_PREFIX, slug)
    : undefined
  const canonical =
    categoryUrl && isIndexableUrl && page > MIN_PAGE
      ? `${categoryUrl}?${SEARCH_PARAM_PAGE}=${page}`
      : categoryUrl
  const languages =
    baseUrl && isIndexableUrl && page === MIN_PAGE
      ? buildHreflangLanguages(
          baseUrl,
          slug,
          pageData.slugByLocale,
          CATEGORY_PATH_PREFIX
        )
      : undefined

  const baseTitle = seo?.metaTitle ?? pageData.categoryName ?? slug
  const title =
    page > MIN_PAGE && pageLabel ? `${baseTitle} – ${pageLabel}` : baseTitle
  const description = seo?.metaDescription
  const ogImage = seo?.ogImage?.url

  return {
    title,
    description,
    robots: resolveRobots({
      noIndex: seo?.noIndex === true,
      isIndexableUrl,
    }),
    alternates: {
      ...(canonical && { canonical }),
      ...(languages && { languages }),
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      images: ogImage ? [{ url: ogImage }] : [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage ?? DEFAULT_OG_IMAGE.url],
    },
  }
}

function resolveRobots({
  noIndex,
  isIndexableUrl,
}: {
  noIndex: boolean
  isIndexableUrl: boolean
}): string | undefined {
  if (noIndex) {
    return 'noindex, nofollow'
  }
  // follow (not nofollow): refined and out-of-range pages must keep passing
  // crawlers on to the products they link, they just must not be indexed.
  return isIndexableUrl ? undefined : 'noindex, follow'
}
