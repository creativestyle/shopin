import type { CartResponse } from '@core/contracts/cart/cart'
import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import type { ProductDetailsResponse } from '@core/contracts/product/product-details'

/** A mock cart as the mock platform holds it: the cart plus its custom fields (like a platform's custom type). */
export type MockCart = CartResponse & {
  custom: { fields: Record<string, unknown> }
}

/** A product's attributes in the mock catalog. */
export interface MockAttributes {
  color: string
  size: string
  material: string
  brand: string
}

/** A mock product card as the mock catalog holds it: the card plus its catalog attributes. */
export type MockProductCard = ProductCardResponse & {
  attributes?: MockAttributes
}

/** A mock product (product page) as the mock catalog holds it: the product plus its catalog attributes. */
export type MockProduct = ProductDetailsResponse & {
  attributes?: MockAttributes
}

export interface MockOptions {
  /**
   * The shop's mapper hooks (docs/extending.md): each runs after the built-in mapper, gets the mock platform's
   * record and the mapped contract, and returns the contract with the shop's own fields.
   */
  mappers?: {
    cart?: (
      cart: MockCart,
      mapped: CartResponse
    ) => CartResponse & Record<string, unknown>
    /** Every product card: search results, category pages, wishlist items. */
    productCard?: (
      card: MockProductCard,
      mapped: ProductCardResponse
    ) => ProductCardResponse & Record<string, unknown>
    /** The product of the product page. */
    product?: (
      product: MockProduct,
      mapped: ProductDetailsResponse
    ) => ProductDetailsResponse & Record<string, unknown>
  }
}
