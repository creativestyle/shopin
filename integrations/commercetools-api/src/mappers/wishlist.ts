import type {
  ShoppingList,
  ShoppingListLineItem,
} from '@commercetools/platform-sdk'
import type { WishlistResponse } from '@core/contracts/wishlist/wishlist'
import { WishlistResponseSchema } from '@core/contracts/wishlist/wishlist'
import { resolveCurrencyFromLanguage } from '@core/i18n/currency-utils'
import { getLocalizedString as mapLocalized } from '../helpers/get-localized-string'
import { buildInClause } from '../helpers/build-in-clause'
import { ProductProjectionPagedQueryApiResponseSchema } from '../schemas/product-projection'
import type { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk'

type ValidLineItem = Omit<ShoppingListLineItem, 'productId' | 'variant'> & {
  productId: string
  variant: NonNullable<ShoppingListLineItem['variant']> & {
    prices: NonNullable<NonNullable<ShoppingListLineItem['variant']>['prices']>
  }
}

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

  // Drop items whose product was deleted/unpublished (no variant) or have no prices (schema requires price).
  const lineItems = (shoppingList.lineItems ?? []).filter(
    (item): item is ValidLineItem =>
      !!item.productId && !!item.variant && !!item.variant.prices?.length
  )

  // Shopping list expansion doesn't return slugs, so fetch product projections separately.
  const productIds = lineItems.map((item) => item.productId)
  const productSlugMap = new Map<string, string>()

  if (productIds.length > 0) {
    const whereClause = buildInClause('id', productIds)

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

  const items = lineItems.map((lineItem) => {
    const productName = mapLocalized(lineItem.name, currentLanguage) ?? ''
    const variantPrice =
      lineItem.variant.prices.find((p) => p.value.currencyCode === currency) ??
      lineItem.variant.prices[0]
    const price = {
      regularPriceInCents: variantPrice.value.centAmount,
      discountedPriceInCents: variantPrice.discounted?.value.centAmount,
      currency: variantPrice.value.currencyCode,
      fractionDigits: variantPrice.value.fractionDigits,
    }

    return {
      id: lineItem.id,
      product: {
        id: lineItem.productId,
        name: productName,
        slug: productSlugMap.get(lineItem.productId) ?? '',
        image: {
          src: lineItem.variant.images?.[0]?.url ?? '/placeholder-product.png',
          alt: productName,
        },
        price,
        variantId: lineItem.variant.id?.toString(),
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
