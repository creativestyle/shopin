import type { LocalizedStringApiResponse } from '../schemas/localized-string'
import type { CartLineItemProductApiResponse } from '../schemas/cart'
import { getLocalizedString } from './get-localized-string'

/**
 * Extracts a localized product slug from a cart line item product.
 * Handles the nested optional structure: product.masterData.current.slug
 *
 * @param product - The cart line item product (may be undefined)
 * @param language - The current language/locale for localization
 * @returns The localized slug string, or undefined if not available
 */
export function getLocalizedProductSlug(
  product: CartLineItemProductApiResponse | undefined,
  language: string
): string | undefined {
  const slug = product?.masterData?.current?.slug
  if (!slug) {
    return undefined
  }

  return getLocalizedString(slug as LocalizedStringApiResponse, language)
}
