import type { Metadata } from 'next'
import type { ProductPageResponse } from '@core/contracts/product/product-page'
import { buildCanonicalUrl, buildHreflangLanguages } from '@/lib/site-url'
import { buildMetaDescription } from '@/features/seo/plain-text'
import { DEFAULT_OG_IMAGE, SITE_NAME } from '@/features/seo/site-metadata'

export interface BuildProductPageMetadataParams {
  pageData: ProductPageResponse
  localePrefix: string
  baseUrl: string | undefined
}

/**
 * Build Next.js metadata for the PDP: product-specific title/description,
 * canonical, hreflang and social tags.
 *
 * The canonical deliberately drops the `variantId` query parameter that variant
 * links carry (e.g. /p/baby-grand-piano?variantId=2) so all variant URLs of a
 * product consolidate into a single indexed page.
 *
 * openGraph/twitter are restated in full because Next.js merges metadata
 * shallowly — a page that sets `openGraph` replaces the root layout's object.
 */
export function buildProductPageMetadata({
  pageData,
  localePrefix,
  baseUrl,
}: BuildProductPageMetadataParams): Metadata {
  const { product, seo } = pageData

  const canonical = baseUrl
    ? buildCanonicalUrl(baseUrl, localePrefix, 'p', product.slug)
    : undefined
  const languages = baseUrl
    ? buildHreflangLanguages(baseUrl, product.slug, product.slugByLocale, 'p')
    : undefined

  const title = seo?.metaTitle ?? product.name
  const description =
    seo?.metaDescription ?? buildMetaDescription(product.description)
  const imageUrl = seo?.ogImage?.url ?? product.gallery.images[0]?.src
  const images = imageUrl
    ? [{ url: imageUrl, alt: product.gallery.images[0]?.alt ?? product.name }]
    : [DEFAULT_OG_IMAGE]

  return {
    title,
    description,
    robots: seo?.noIndex === true ? 'noindex, nofollow' : undefined,
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
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((image) => image.url),
    },
  }
}
