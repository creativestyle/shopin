/**
 * The discount code responses are parsed with the same contract as every other cart response (`Contracts.cart`):
 * the shop's own cart fields (`contracts.cart` in shopin.config.ts) stay in them, unknown fields are still dropped.
 */
import { CartController } from './cart.controller'

// the BFF's test config (apps/bff/test/shop-config.ts) with a shop field on the cart
jest.mock('@shopin/config', () => {
  const { z } = jest.requireActual<typeof import('zod')>('zod')
  const { config } = jest.requireActual<{ config: object }>('@shopin/config')
  return {
    config: {
      ...config,
      contracts: { cart: z.object({ giftMessage: z.string() }) },
    },
  }
})

const price = { regularPriceInCents: 1000, currency: 'EUR' }
const cart = {
  id: 'c1',
  version: 2,
  lineItems: [],
  subtotal: price,
  grandTotal: price,
  currency: 'EUR',
  itemCount: 0,
  discountCodes: [{ id: 'd1', code: 'SAVE10', applied: true }],
  giftMessage: 'Happy birthday',
  internalNote: 'not part of any contract',
}

const controller = () =>
  new CartController({
    applyDiscountCode: async () => cart,
    removeDiscountCode: async () => ({ ...cart, discountCodes: undefined }),
  } as never)

describe("discount code responses keep the shop's cart fields", () => {
  it('POST discount-code', async () => {
    const response = await controller().applyDiscountCode({ code: 'SAVE10' })
    expect(response).toMatchObject({
      id: 'c1',
      giftMessage: 'Happy birthday',
    })
    expect(response).not.toHaveProperty('internalNote')
  })

  it('DELETE discount-code', async () => {
    const response = await controller().removeDiscountCode({
      discountCodeId: 'd1',
    })
    expect(response).toMatchObject({
      id: 'c1',
      giftMessage: 'Happy birthday',
    })
    expect(response).not.toHaveProperty('internalNote')
  })
})
