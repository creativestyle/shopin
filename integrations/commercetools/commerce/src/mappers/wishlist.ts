import type {
  ProductProjection,
  ShoppingList,
  ShoppingListLineItem,
} from '@commercetools/platform-sdk'
import type { CommercetoolsMappers } from '../mapper-hooks'
import type { WishlistResponse } from '@core/contracts/wishlist/wishlist'
import { WishlistResponseSchema } from '@core/contracts/wishlist/wishlist'
import { resolveCurrencyFromLanguage } from '@core/i18n/currency-utils'
import { resolveCountryFromLanguage } from '@core/i18n/language-tag-utils'
import { getLocalizedString as mapLocalized } from '../helpers/get-localized-string'
import { fetchProjectionsByIds } from '../helpers/fetch-projections'
import type { ProductProjectionApiResponse } from '../schemas/product-projection'
import type { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk'

type ValidLineItem = Omit<ShoppingListLineItem, 'productId' | 'variant'> & {
  productId: string
  variant: NonNullable<ShoppingListLineItem['variant']>
}

/**
 * Maps a Commercetools ShoppingList to WishlistResponse
 * Fetches product projections to get slugs and prices for the current language; the shop's card hook
 * (`commercetools({ mappers: { productCard } })`) gets each item's projection and its mapped card.
 */
export async function mapShoppingListToWishlist(
  shoppingList: ShoppingList,
  currentLanguage: string,
  client: ByProjectKeyRequestBuilder,
  productCard?: CommercetoolsMappers['productCard']
): Promise<WishlistResponse & { version: number }> {
  // Drop items whose product was deleted/unpublished (no variant). Items without a price in
  // the store currency stay on the list and show no price.
  const lineItems = (shoppingList.lineItems ?? []).filter(
    (item): item is ValidLineItem => !!item.productId && !!item.variant
  )

  // Shopping list expansion returns neither slugs nor a selected price, so fetch the
  // product projections with Price Selection: the wishlist then shows the same price
  // as the product page, the one commercetools picked for this store.
  const productIds = [...new Set(lineItems.map((item) => item.productId))]
  const fetched = await fetchProjectionsByIds(
    client,
    productIds,
    currentLanguage,
    resolveCurrencyFromLanguage(currentLanguage),
    resolveCountryFromLanguage(currentLanguage)
  )
  const projectionById = new Map<string, ProductProjectionApiResponse>(
    fetched.map((product) => [product.id, product])
  )
  // the shop's card hook reads the projection as commercetools returned it (parsed by the projection schema)
  const projections = new Map<string, ProductProjection>(
    fetched.map((product) => [
      product.id,
      product as unknown as ProductProjection,
    ])
  )

  const items = lineItems.map((lineItem) => {
    const productName = mapLocalized(lineItem.name, currentLanguage) ?? ''
    const projection = projectionById.get(lineItem.productId)
    const variantPrice = projection
      ? [projection.masterVariant, ...(projection.variants ?? [])].find(
          (variant) => variant.id === lineItem.variant.id
        )?.price
      : undefined
    const price = variantPrice && {
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
        slug: projection
          ? mapLocalized(projection.slug, currentLanguage) || projection.id
          : '',
        image: {
          src: lineItem.variant.images?.[0]?.url ?? '/placeholder-product.png',
          alt: productName,
        },
        price,
        variantId: lineItem.variant.id?.toString(),
      },
    }
  })

  // commercetools lists always have a version; the service writes with it (the contract's `version` is optional)
  const wishlist = {
    ...WishlistResponseSchema.parse({
      id: shoppingList.id,
      items,
      itemCount: items.length,
    }),
    version: shoppingList.version,
  }
  if (!productCard) {
    return wishlist
  }
  return {
    ...wishlist,
    items: wishlist.items.map((item) => {
      const projection = projections.get(item.product.id)
      return projection
        ? { ...item, product: productCard(projection, item.product) }
        : item
    }),
  }
}
