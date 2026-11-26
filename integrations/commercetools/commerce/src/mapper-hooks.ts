import type { Cart, ProductProjection } from '@commercetools/platform-sdk'
import type { CartResponse } from '@core/contracts/cart/cart'
import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import type { ProductDetailsResponse } from '@core/contracts/product/product-details'

/**
 * The shop's mapper hooks (`commercetools({ mappers })`, docs/extending.md). Each runs after the built-in
 * mapper, gets the commercetools resource and the mapped contract, and returns the contract with the shop's
 * own fields.
 */
export interface CommercetoolsMappers {
  /** Every cart response: `cart` is the commercetools Cart as returned (custom fields under `cart.custom`). */
  cart?: (
    cart: Cart,
    mapped: CartResponse
  ) => CartResponse & Record<string, unknown>
  /**
   * Every product card of a search result, a category page or a wishlist: `product` is the projection with the
   * fields SHOPin reads (names, slugs, variants with their attributes).
   */
  productCard?: (
    product: ProductProjection,
    mapped: ProductCardResponse
  ) => ProductCardResponse & Record<string, unknown>
  /**
   * The product of the product page: `product` is the published projection (all variants with their attributes,
   * the product type and categories expanded).
   */
  product?: (
    product: ProductProjection,
    mapped: ProductDetailsResponse
  ) => ProductDetailsResponse & Record<string, unknown>
}

/** The hooks as the ports receive them (a Nest provider of the commerce and search ports). */
export abstract class MapperHooks implements CommercetoolsMappers {
  abstract readonly cart?: CommercetoolsMappers['cart']
  abstract readonly productCard?: CommercetoolsMappers['productCard']
  abstract readonly product?: CommercetoolsMappers['product']
}
