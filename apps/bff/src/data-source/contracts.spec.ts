/**
 * Version fields are optional (issue #345, criterion 25): a platform without versions returns cart, order, wishlist
 * and customer without one, and the BFF's response contracts accept them; a version that is there is kept.
 */
import { CustomerResponseSchema } from '@core/contracts/customer/customer'
import { OrderResponseSchema } from '@core/contracts/order/order'
import { Contracts } from './contracts'

const price = { regularPriceInCents: 1000, currency: 'EUR' }
const cart = {
  id: 'c1',
  lineItems: [],
  subtotal: price,
  grandTotal: price,
  currency: 'EUR',
  itemCount: 0,
}
const payloads = {
  cart: [Contracts.cart, cart],
  order: [
    OrderResponseSchema,
    {
      ...cart,
      orderNumber: '1001',
      createdAt: '2026-01-01T00:00:00.000Z',
      orderState: 'Open',
      shippingInfo: undefined,
      paymentInfo: undefined,
    },
  ],
  wishlist: [Contracts.wishlist, { id: 'w1', items: [], itemCount: 0 }],
  customer: [
    CustomerResponseSchema.strip(),
    { id: 'u1', email: 'shopper@example.com' },
  ],
} as const

describe.each(Object.entries(payloads))('%s contract', (_, [schema, body]) => {
  it('accepts a payload without version', () => {
    const parsed = schema.parse(body)

    expect(parsed).toMatchObject({ id: body.id })
    expect(parsed).not.toHaveProperty('version')
  })

  it('keeps a version that is there', () => {
    expect(schema.parse({ ...body, version: 3 })).toMatchObject({
      id: body.id,
      version: 3,
    })
  })
})
