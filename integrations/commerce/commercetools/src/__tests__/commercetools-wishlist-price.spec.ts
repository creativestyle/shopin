import { WishlistService } from '..'

function price(
  id: string,
  centAmount: number,
  currencyCode: string,
  country?: string
) {
  return {
    id,
    value: {
      centAmount,
      currencyCode,
      type: 'centPrecision' as const,
      fractionDigits: 2,
    },
    ...(country && { country }),
  }
}

type Price = ReturnType<typeof price>

function lineItem(id: string, prices: Price[]) {
  return {
    id,
    productId: `product-${id}`,
    name: { 'de-DE': `Product ${id}` },
    variant: { id: 1, prices },
  }
}

// The product projection as commercetools returns it with Price Selection:
// `price` is the one price it picked for the store, absent when it picked none.
function projection(id: string, selected?: Price) {
  return {
    id: `product-${id}`,
    createdAt: '2020-01-01T00:00:00.000Z',
    name: { 'de-DE': `Product ${id}` },
    slug: { 'de-DE': `product-${id}` },
    masterVariant: { id: 1, ...(selected && { price: selected }) },
  }
}

function createService(
  language: string,
  lineItems: unknown[],
  projections: unknown[]
) {
  const shoppingList = { id: 'wishlist-1', version: 1, lineItems }
  const execute = (body: unknown) => ({
    execute: jest.fn().mockResolvedValue({ body }),
  })
  const projectionsGet = jest
    .fn()
    .mockReturnValue(execute({ results: projections }))
  const client = {
    me: () => ({
      shoppingLists: () => ({
        withId: () => ({ get: () => execute(shoppingList) }),
      }),
    }),
    productProjections: () => ({ get: projectionsGet }),
  }
  const userClientService = { getClient: async () => client }
  const languageProvider = { getCurrentLanguage: () => language }
  const service = new WishlistService(
    userClientService as never,
    languageProvider as never
  )
  return { service, projectionsGet }
}

describe('CommercetoolsWishlistService price selection', () => {
  it('shows the price commercetools selected for the store, not one from the line item list', async () => {
    const { service, projectionsGet } = createService(
      'de-DE',
      [
        lineItem('a', [
          price('usd', 9900, 'USD', 'US'),
          price('eur-at', 8800, 'EUR', 'AT'),
        ]),
      ],
      [projection('a', price('eur-de', 3000, 'EUR', 'DE'))]
    )

    const wishlist = await service.getWishlist('wishlist-1')

    expect(projectionsGet).toHaveBeenCalledWith({
      queryArgs: expect.objectContaining({
        priceCurrency: 'EUR',
        priceCountry: 'DE',
      }),
    })
    expect(wishlist.items[0]?.product.price).toEqual({
      regularPriceInCents: 3000,
      currency: 'EUR',
      fractionDigits: 2,
    })
    expect(wishlist.items[0]?.product.slug).toBe('product-a')
  })

  it('keeps an item commercetools selected no price for, without a price', async () => {
    const { service } = createService(
      'de-DE',
      [lineItem('a', [price('eur-de', 3000, 'EUR', 'DE')])],
      [projection('a')]
    )

    const wishlist = await service.getWishlist('wishlist-1')

    expect(wishlist.itemCount).toBe(1)
    expect(wishlist.items[0]?.product.price).toBeUndefined()
  })
})
