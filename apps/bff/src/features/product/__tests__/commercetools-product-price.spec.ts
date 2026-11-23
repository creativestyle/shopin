import { ProductService } from '@integrations/commercetools-api'

type Price = {
  id: string
  value: {
    centAmount: number
    currencyCode: string
    type: 'centPrecision'
    fractionDigits: number
  }
  country?: string
  discounted?: {
    value: {
      centAmount: number
      currencyCode: string
      type: 'centPrecision'
      fractionDigits: number
    }
    discount: { typeId: 'product-discount'; id: string }
  }
}

function money(centAmount: number, currencyCode: string) {
  return {
    centAmount,
    currencyCode,
    type: 'centPrecision' as const,
    fractionDigits: 2,
  }
}

function price(
  id: string,
  centAmount: number,
  currencyCode: string,
  country?: string,
  discountedCentAmount?: number
): Price {
  return {
    id,
    value: money(centAmount, currencyCode),
    ...(country && { country }),
    ...(discountedCentAmount !== undefined && {
      discounted: {
        value: money(discountedCentAmount, currencyCode),
        discount: { typeId: 'product-discount', id: 'discount-1' },
      },
    }),
  }
}

// Old enough that the "NEW" badge never appears, so badges hold only the discount.
const CREATED_AT = '2020-01-01T00:00:00.000Z'

function createService(
  language: string,
  variant: { price?: Price; prices?: Price[] }
) {
  const product = {
    id: 'product-1',
    createdAt: CREATED_AT,
    name: { [language]: 'Shirt' },
    slug: { [language]: 'shirt' },
    masterVariant: { id: 1, sku: 'SKU-1', ...variant },
  }
  const get = jest.fn().mockReturnValue({
    execute: jest.fn().mockResolvedValue({ body: { results: [product] } }),
  })
  const client = { productProjections: () => ({ get }) }
  const languageProvider = { getCurrentLanguage: () => language }
  const service = new ProductService(client as never, languageProvider as never)
  return { service, get }
}

describe('CommercetoolsProductService price selection', () => {
  it('asks commercetools to select the price for the store currency and country', async () => {
    const { service, get } = createService('de-DE', {
      price: price('selected', 2000, 'EUR', 'DE'),
    })

    await service.getProduct('shirt')

    expect(get).toHaveBeenCalledWith({
      queryArgs: expect.objectContaining({
        priceCurrency: 'EUR',
        priceCountry: 'DE',
      }),
    })
  })

  it('uses the price commercetools selected over the prices list', async () => {
    const { service } = createService('de-DE', {
      price: price('selected', 2000, 'EUR', 'DE'),
      prices: [
        price('usd', 9900, 'USD', 'US'),
        price('eur-de', 3000, 'EUR', 'DE'),
      ],
    })

    const { product } = await service.getProduct('shirt')

    expect(product.price).toEqual({
      regularPriceInCents: 2000,
      currency: 'EUR',
      fractionDigits: 2,
    })
  })

  it('shows no price when commercetools selected none, even with store-currency prices in the list', async () => {
    // e.g. a customer-group price or one that starts next month: commercetools skipped it on purpose
    const { service } = createService('de-DE', {
      prices: [price('eur-de', 3000, 'EUR', 'DE'), price('eur', 4000, 'EUR')],
    })

    const { product } = await service.getProduct('shirt')

    expect(product.price).toBeUndefined()
    expect(product.badges).toBeUndefined()
  })

  it('shows a free product at 0, not as unavailable', async () => {
    const { service } = createService('de-DE', {
      price: price('free', 0, 'EUR', 'DE'),
    })

    const { product } = await service.getProduct('shirt')

    expect(product.price).toEqual({
      regularPriceInCents: 0,
      currency: 'EUR',
      fractionDigits: 2,
    })
  })

  it('shows no price when only prices in another currency exist', async () => {
    const { service } = createService('de-DE', {
      prices: [price('usd-us', 9900, 'USD', 'US'), price('usd', 9900, 'USD')],
    })

    const { product } = await service.getProduct('shirt')

    expect(product.price).toBeUndefined()
    expect(product.badges).toBeUndefined()
  })

  it('shows no price when the variant has no price', async () => {
    const { service } = createService('en-US', {})

    const { product } = await service.getProduct('shirt')

    expect(product.price).toBeUndefined()
    expect(product.badges).toBeUndefined()
  })
})

describe('CommercetoolsProductService PDP badges', () => {
  it('takes the discount badge from the selected price, not the first listed one', async () => {
    const { service } = createService('de-DE', {
      price: price('selected', 2000, 'EUR', 'DE', 1500),
      prices: [
        price('usd', 10000, 'USD', 'US', 5000),
        price('eur-de', 2000, 'EUR', 'DE', 1500),
      ],
    })

    const { product } = await service.getProduct('shirt')

    expect(product.price).toEqual({
      regularPriceInCents: 2000,
      discountedPriceInCents: 1500,
      currency: 'EUR',
      fractionDigits: 2,
    })
    expect(product.badges).toEqual([{ variant: 'red', text: '-25%' }])
  })

  it('shows no discount badge when commercetools selected no price', async () => {
    const { service } = createService('de-DE', {
      prices: [price('eur-de', 2000, 'EUR', 'DE', 1500)],
    })

    const { product } = await service.getProduct('shirt')

    expect(product.price).toBeUndefined()
    expect(product.badges).toBeUndefined()
  })
})
