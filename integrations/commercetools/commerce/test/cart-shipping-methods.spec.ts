import { CartService } from '../src/services/cart.service'
import { CustomerScope } from '../src/shared/customer-scope.service'

function rate(centAmount: number, currencyCode: string, isMatching?: boolean) {
  return {
    price: { centAmount, currencyCode },
    ...(isMatching !== undefined && { isMatching }),
  }
}

type Rate = ReturnType<typeof rate>

function shippingMethod(
  id: string,
  rates: Rate[][],
  extra: Record<string, unknown> = {}
) {
  return {
    id,
    name: `method-${id}`,
    zoneRates: rates.map((shippingRates) => ({ shippingRates })),
    ...extra,
  }
}

function createService(language: string, results: unknown[]) {
  const client = {
    // the shopper's own cart is read first (any other id answers 404)
    me: () => ({
      carts: () => ({
        withId: () => ({
          get: () => ({
            execute: jest.fn().mockResolvedValue({ body: { id: 'cart-1' } }),
          }),
        }),
      }),
    }),
    shippingMethods: () => ({
      matchingCart: () => ({
        get: () => ({
          execute: jest.fn().mockResolvedValue({ body: { results } }),
        }),
      }),
    }),
  }
  const userClientService = { getClient: async () => client }
  const languageProvider = { getCurrentLanguage: () => language }
  return new CartService(
    new CustomerScope(
      {} as never,
      userClientService as never,
      { get: async () => undefined } as never
    ),
    {} as never,
    languageProvider as never
  )
}

describe('CommercetoolsCartService shipping methods', () => {
  it('uses the rate commercetools matched to the cart in a multi-currency zone', async () => {
    const service = createService('de-DE', [
      shippingMethod('a', [
        [rate(900, 'USD', false), rate(500, 'EUR', true), rate(700, 'EUR')],
      ]),
    ])

    const { shippingMethods } = await service.getShippingMethods('cart-1')

    expect(shippingMethods[0]?.price).toEqual({
      centAmount: 500,
      currencyCode: 'EUR',
    })
  })

  it('falls back to the rate in the cart currency when none is marked matching', async () => {
    const service = createService('de-DE', [
      shippingMethod('a', [[rate(900, 'USD')], [rate(700, 'EUR')]]),
    ])

    const { shippingMethods } = await service.getShippingMethods('cart-1')

    expect(shippingMethods[0]?.price).toEqual({
      centAmount: 700,
      currencyCode: 'EUR',
    })
  })

  it('omits a method with no usable rate instead of showing it as free', async () => {
    const service = createService('de-DE', [
      shippingMethod('a', [[rate(900, 'USD')]]),
      shippingMethod('b', [[rate(500, 'EUR')]]),
    ])

    const { shippingMethods } = await service.getShippingMethods('cart-1')

    expect(shippingMethods.map((method) => method.id)).toEqual(['b'])
  })

  it('falls back to the default locale for name, description and delivery time', async () => {
    const service = createService('de-DE', [
      shippingMethod('a', [[rate(500, 'EUR')]], {
        localizedName: { 'en-US': 'Standard' },
        localizedDescription: { 'en-US': 'Standard delivery' },
        custom: { fields: { deliveryTime: { 'en-US': '2-3 business days' } } },
      }),
    ])

    const { shippingMethods } = await service.getShippingMethods('cart-1')

    expect(shippingMethods[0]).toMatchObject({
      name: 'Standard',
      description: 'Standard delivery',
      deliveryTime: '2-3 business days',
    })
  })

  it('resolves name, description and delivery time to the request language', async () => {
    const service = createService('de-DE', [
      shippingMethod('a', [[rate(500, 'EUR')]], {
        localizedName: { 'en-US': 'Standard', 'de-DE': 'Standardversand' },
        custom: {
          fields: {
            deliveryTime: { 'en-US': '1 business day', 'de-DE': '1 Werktag' },
          },
        },
      }),
    ])

    const { shippingMethods } = await service.getShippingMethods('cart-1')

    expect(shippingMethods[0]).toMatchObject({
      name: 'Standardversand',
      deliveryTime: '1 Werktag',
    })
  })

  it('keeps the method when the deliveryTime field has another type', async () => {
    const service = createService('de-DE', [
      shippingMethod('a', [[rate(500, 'EUR')]], {
        custom: { fields: { deliveryTime: '2-3 days' } },
      }),
    ])

    const { shippingMethods } = await service.getShippingMethods('cart-1')

    expect(shippingMethods).toHaveLength(1)
    expect(shippingMethods[0]?.deliveryTime).toBeUndefined()
  })
})
