// shopin's apps/bff/src/features/cart/__tests__/mock-cart-totals.spec.ts, moved with the mock (node:test, its build)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CartService } from '../dist/services/cart.service.js'

function createService() {
  return new CartService(
    { getCurrentLanguage: () => 'en-US' },
    { setContext: () => {}, warn: () => {} }
  )
}

test('mock CartService totals: keeps shipping and the discount in the total across cart changes', async () => {
  const service = createService()
  const { id } = await service.createCart()

  const withItem = await service.addToCart(id, 'p-1', undefined, 2)
  assert.equal(withItem.grandTotal.regularPriceInCents, 2000)
  const lineItemId = withItem.lineItems[0]?.id ?? ''

  const shipped = await service.setShippingMethod(id, {
    shippingMethodId: 'express',
  })
  assert.equal(shipped.grandTotal.regularPriceInCents, 2300)

  const updated = await service.updateCartItem(id, lineItemId, 3)
  assert.equal(updated.grandTotal.regularPriceInCents, 3300)

  const discounted = await service.addDiscountCode(id, 'SAVE10')
  assert.equal(discounted.grandTotal.regularPriceInCents, 2300)

  const removedItem = await service.updateCartItem(id, lineItemId, 1)
  assert.equal(removedItem.grandTotal.regularPriceInCents, 300)

  const undiscounted = await service.removeDiscountCode(
    id,
    'mock-discount-SAVE10'
  )
  assert.equal(undiscounted.grandTotal.regularPriceInCents, 1300)
})
