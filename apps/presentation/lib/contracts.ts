import { CartResponseSchema } from '@core/contracts/cart/cart'
import { extended } from '@core/contracts/core/extension'

/**
 * The contracts the storefront parses BFF responses with: the core contract, keeping the fields the shop added
 * (`contracts` in config/contracts, docs/extending.md). The BFF already validated those fields against the
 * shop's extension and stripped everything else, so here the core fields are checked and the rest kept.
 */
export const Contracts = {
  cart: extended(CartResponseSchema, CartResponseSchema.loose()),
}
