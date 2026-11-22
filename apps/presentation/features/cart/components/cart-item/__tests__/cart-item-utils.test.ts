import type { LineItemResponse } from '@core/contracts/cart/cart'
import { calculateItemPrices } from '../cart-item-utils'

function item(price: LineItemResponse['price'], quantity = 2) {
  return { price, quantity } as LineItemResponse
}

describe('calculateItemPrices', () => {
  it('uses the discounted price and keeps the original for display', () => {
    expect(
      calculateItemPrices(
        item({
          regularPriceInCents: 1000,
          discountedPriceInCents: 800,
          currency: 'EUR',
        })
      )
    ).toEqual({ totalPrice: 1600, originalPrice: 2000 })
  })

  it('treats a discount to 0 as a discount', () => {
    expect(
      calculateItemPrices(
        item({
          regularPriceInCents: 1000,
          discountedPriceInCents: 0,
          currency: 'EUR',
        })
      )
    ).toEqual({ totalPrice: 0, originalPrice: 2000 })
  })

  it('shows a free item at 0 without an original price', () => {
    expect(
      calculateItemPrices(item({ regularPriceInCents: 0, currency: 'EUR' }))
    ).toEqual({ totalPrice: 0, originalPrice: undefined })
  })
})
