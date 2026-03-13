import type { ShoppingList } from '@commercetools/platform-sdk'
import type { WishlistResponse } from '@core/contracts/wishlist/wishlist'
import { WishlistResponseSchema } from '@core/contracts/wishlist/wishlist'
import { resolveCurrencyFromLanguage } from '@core/i18n/currency-utils'
import { getLocalizedString as mapLocalized } from '../helpers/get-localized-string'
import { ProductProjectionPagedQueryApiResponseSchema } from '../schemas/product-projection'
import type { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk'

/**
 * Maps a Commercetools ShoppingList to WishlistResponse
 * Fetches product projections to get slugs and prices for the current language
 */
export async function mapShoppingListToWishlist(
  shoppingList: ShoppingList,
  currentLanguage: string,
  client: ByProjectKeyRequestBuilder
): Promise<WishlistResponse> {
  // Get currency for current language to filter prices
  const currency = resolveCurrencyFromLanguage(currentLanguage)

  // Fetch product projections to get slugs (shopping list expansion doesn't work)
  const productIds = shoppingList.lineItems?.map((item) => item.productId) || []
  const productSlugMap = new Map<string, string>()

  if (productIds.length > 0) {
    const whereClause = productIds.map((id) => `id="${id}"`).join(' or ')

    const productResponse = await client
      .productProjections()
      .get({
        queryArgs: {
          where: whereClause,
          staged: false,
          localeProjection: currentLanguage,
          limit: productIds.length,
        },
      })
      .execute()

    const pagedResponse = ProductProjectionPagedQueryApiResponseSchema.parse(
      productResponse.body
    )

    // Build map of productId -> slug
    pagedResponse.results.forEach((product) => {
      const slug = mapLocalized(product.slug, currentLanguage) || product.id
      productSlugMap.set(product.id, slug)
    })
  }

  const items = (shoppingList.lineItems || []).map((lineItem) => {
    const productName =
      lineItem.name[currentLanguage] ||
      lineItem.name['en-US'] ||
      Object.values(lineItem.name)[0] ||
      ''

    // Extract price from expanded variant, filtered by current currency
    const variantPrice =
      lineItem.variant?.prices?.find(
        (p) => p.value.currencyCode === currency
      ) || lineItem.variant?.prices?.[0]
    const price = variantPrice
      ? {
          regularPriceInCents: variantPrice.value.centAmount,
          discountedPriceInCents: variantPrice.discounted?.value.centAmount,
          currency: variantPrice.value.currencyCode,
          fractionDigits: variantPrice.value.fractionDigits,
        }
      : undefined

    // Get product slug from the map we built earlier
    const productSlug = productSlugMap.get(lineItem.productId || '') || ''

    return {
      id: lineItem.id, // Line item ID for remove operations
      product: {
        id: lineItem.productId || '',
        name: productName,
        slug: productSlug,
        image: {
          src: lineItem.variant?.images?.[0]?.url || '/placeholder-product.png',
          alt: productName,
        },
        price: price!,
        variantId: lineItem.variant?.id?.toString(),
      },
    }
  })

  return WishlistResponseSchema.parse({
    id: shoppingList.id,
    version: shoppingList.version,
    items,
    itemCount: items.length,
  })
}
