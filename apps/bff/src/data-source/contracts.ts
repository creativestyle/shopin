import { CartResponseSchema } from '@core/contracts/cart/cart'
import { ProductCardResponseSchema } from '@core/contracts/product-collection/product-card'
import { ProductCollectionPageResponseSchema } from '@core/contracts/product-collection/product-collection-page'
import { ProductSearchResponseSchema } from '@core/contracts/product-search/product-search'
import { ProductDetailsResponseSchema } from '@core/contracts/product/product-details'
import { ProductPageResponseSchema } from '@core/contracts/product/product-page'
import { WishlistResponseSchema } from '@core/contracts/wishlist/wishlist'
import { extended, extendedAt } from '@core/contracts/core/extension'
import { config as project } from '@shopin/config'
import { z } from 'zod'

const card = ProductCardResponseSchema.strip()
const cards = project.contracts?.productCard

/**
 * The contracts the BFF parses its responses with: the core contract, extended with the shop's fields where
 * `shopin.config.ts` sets `contracts` (docs/extending.md). Unknown fields are still stripped.
 */
export const Contracts = {
  cart: extended(CartResponseSchema.strip(), project.contracts?.cart),
  productSearch: extendedAt(
    ProductSearchResponseSchema.strip(),
    ['products'],
    card,
    cards
  ),
  productCollectionPage: extendedAt(
    ProductCollectionPageResponseSchema.strip(),
    ['productList'],
    card,
    cards
  ),
  wishlist: extendedAt(
    WishlistResponseSchema.strip(),
    ['items', 'product'],
    card,
    cards
  ),
  productPage: extendedAt(
    ProductPageResponseSchema.strip(),
    ['product'],
    ProductDetailsResponseSchema.strip(),
    project.contracts?.product
  ),
}

/**
 * What `PUT /bff/cart/fields` takes: the fields of the shop's `contracts.cart` it lists in `cartFields`, each checked
 * by its own schema there (`null` removes one). Every other field (SHOPin's own, one the server decides, an unknown
 * key) is refused, so a request cannot write what the shop did not open to shoppers. None are writable by default.
 */
export const CartFieldsSchema = z
  .strictObject(
    Object.fromEntries(
      Object.entries(
        (project.contracts?.cart as { shape?: Record<string, z.ZodType> })
          ?.shape ?? {}
      )
        .filter(
          ([key]) =>
            !(key in CartResponseSchema.shape) &&
            (project.cartFields ?? []).includes(key)
        )
        .map(([key, schema]) => [key, z.union([schema, z.null()])])
    )
  )
  .partial()
