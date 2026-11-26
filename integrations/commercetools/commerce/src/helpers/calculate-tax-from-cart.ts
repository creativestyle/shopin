import type { CartApiResponse } from '../schemas/cart'

/**
 * Calculates the tax amount in cents from a cart's taxed price.
 * Tax is the difference between totalGross and totalNet amounts.
 *
 * @param cart - The cart response containing optional taxedPrice
 * @returns The tax amount in cents, or undefined if taxed price is not available
 */
export function calculateTaxFromCart(
  cart: CartApiResponse
): number | undefined {
  const totalGross = cart.taxedPrice?.totalGross.centAmount
  const totalNet = cart.taxedPrice?.totalNet.centAmount

  if (totalGross !== undefined && totalNet !== undefined) {
    return totalGross - totalNet
  }

  return undefined
}
