import { CartService } from '@integrations/mock-api'

function createService() {
  return new CartService(
    { getCurrentLanguage: () => 'en-US' } as never,
    { setContext: jest.fn(), warn: jest.fn() } as never
  )
}

describe('mock CartService totals', () => {
  it('keeps shipping and the discount in the total across cart changes', async () => {
    const service = createService()
    const { id } = await service.createCart()

    const withItem = await service.addToCart(id, 'p-1', undefined, 2)
    expect(withItem.grandTotal.regularPriceInCents).toBe(2000)
    const lineItemId = withItem.lineItems[0]?.id ?? ''

    const shipped = await service.setShippingMethod(id, {
      shippingMethodId: 'express',
    })
    expect(shipped.grandTotal.regularPriceInCents).toBe(2300)

    const updated = await service.updateCartItem(id, lineItemId, 3)
    expect(updated.grandTotal.regularPriceInCents).toBe(3300)

    const discounted = await service.addDiscountCode(id, 'SAVE10')
    expect(discounted.grandTotal.regularPriceInCents).toBe(2300)

    const removedItem = await service.updateCartItem(id, lineItemId, 1)
    expect(removedItem.grandTotal.regularPriceInCents).toBe(300)

    const undiscounted = await service.removeDiscountCode(
      id,
      'mock-discount-SAVE10'
    )
    expect(undiscounted.grandTotal.regularPriceInCents).toBe(1300)
  })
})
