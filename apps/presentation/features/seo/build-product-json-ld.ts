import type { ProductDetailsResponse } from '@core/contracts/product/product-details'
import {
  JSONLD_MAX_DESCRIPTION_LENGTH,
  JSONLD_MAX_IMAGES,
} from '@config/constants'
import type { JsonLdData } from './json-ld'
import { buildMetaDescription } from './plain-text'

export interface BuildProductJsonLdParams {
  product: ProductDetailsResponse
  /** Canonical PDP URL — used as the Offer url and the Product @id. */
  url: string | undefined
  /** Site origin, used to absolutize gallery images served from /public. */
  baseUrl: string | undefined
}

const DEFAULT_FRACTION_DIGITS = 2

/** Minor units (cents) → decimal string schema.org expects, e.g. 129900 → "1299.00". */
function formatMinorUnits(
  amountInCents: number,
  fractionDigits?: number
): string {
  const digits = fractionDigits ?? DEFAULT_FRACTION_DIGITS
  return (amountInCents / 10 ** digits).toFixed(digits)
}

/**
 * Absolute image URLs, capped at JSONLD_MAX_IMAGES.
 *
 * schema.org requires absolute URLs, so root-relative sources (a data source
 * serving images from /public) are resolved against the site origin rather than
 * dropped; anything still relative after that is skipped as unusable.
 */
function resolveImages(
  product: ProductDetailsResponse,
  baseUrl: string | undefined
): string[] {
  const images: string[] = []
  for (const { src } of product.gallery.images) {
    if (images.length >= JSONLD_MAX_IMAGES) {
      break
    }
    if (/^https?:\/\//.test(src)) {
      images.push(src)
    } else if (src.startsWith('/') && baseUrl) {
      images.push(`${baseUrl}${src}`)
    }
  }
  return images
}

/**
 * Product structured data for the PDP (Google Merchant / Rich Results "Product" type).
 *
 * Covers everything the product contract carries: name, description, gallery
 * images and an Offer with the effective price (discounted when present) and currency.
 *
 * Not emitted because no data source provides it yet — adding either means extending
 * `ProductDetailsResponse` in core/contracts plus the commercetools/mock mappers:
 *  - `offers.availability` — no stock/availability field in the catalog contract.
 *  - `aggregateRating` / `review` — no review provider is integrated.
 * Both are *recommended*, not required, properties: the markup validates without them,
 * but review stars and stock state cannot appear in search results until they exist.
 */
export function buildProductJsonLd({
  product,
  url,
  baseUrl,
}: BuildProductJsonLdParams): JsonLdData {
  const { price } = product
  const effectivePriceInCents =
    price.discountedPriceInCents ?? price.regularPriceInCents
  const images = resolveImages(product, baseUrl)
  // Bounded: the same description is already in the visible HTML, so an unbounded
  // copy here would double the payload of long catalog copy for no ranking gain.
  const description = buildMetaDescription(
    product.description,
    JSONLD_MAX_DESCRIPTION_LENGTH
  )

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'productID': product.id,
    ...(description && { description }),
    ...(images.length > 0 && { image: images }),
    ...(url && { '@id': url, url }),
    'offers': {
      '@type': 'Offer',
      'price': formatMinorUnits(effectivePriceInCents, price.fractionDigits),
      'priceCurrency': price.currency,
      ...(url && { url }),
    },
  }
}
