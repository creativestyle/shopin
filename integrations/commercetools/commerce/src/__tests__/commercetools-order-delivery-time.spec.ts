import { OrderService } from '..'

function order(deliveryTime: unknown) {
  return {
    id: 'order-1',
    version: 1,
    orderNumber: '1001',
    createdAt: '2026-01-01T00:00:00.000Z',
    orderState: 'Open',
    lineItems: [],
    totalPrice: { centAmount: 500, currencyCode: 'EUR' },
    shippingInfo: {
      shippingMethodName: 'Standard',
      price: { centAmount: 500, currencyCode: 'EUR' },
      shippingMethod: {
        typeId: 'shipping-method',
        id: 'method-1',
        obj: { custom: { fields: { deliveryTime } } },
      },
    },
  }
}

function createService(language: string, body: unknown) {
  const client = {
    me: () => ({
      orders: () => ({
        withId: () => ({
          get: () => ({
            execute: jest.fn().mockResolvedValue({ body }),
          }),
        }),
      }),
    }),
  }
  const userClientService = { getClient: async () => client }
  const languageProvider = { getCurrentLanguage: () => language }
  return new OrderService(userClientService as never, languageProvider as never)
}

describe('CommercetoolsOrderService delivery time', () => {
  it('maps the localized deliveryTime custom field of the shipping method', async () => {
    const service = createService(
      'de-DE',
      order({ 'de-DE': '2-3 Werktage', 'en-US': '2-3 business days' })
    )

    const result = await service.getOrder('order-1')

    expect(result.shippingInfo?.deliveryTime).toBe('2-3 Werktage')
  })

  it('still returns the order when the deliveryTime field has another type', async () => {
    const service = createService('de-DE', order('2-3 days'))

    const result = await service.getOrder('order-1')

    expect(result.id).toBe('order-1')
    expect(result.shippingInfo?.deliveryTime).toBeUndefined()
  })
})
