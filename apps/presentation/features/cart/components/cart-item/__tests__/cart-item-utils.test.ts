import type { LineItemResponse } from '@core/contracts/cart/cart'
import { formatItemAttributes, getUnitPrice } from '../cart-item-utils'

function createItem(
  price: Partial<LineItemResponse['price']>
): LineItemResponse {
  return {
    id: 'line-1',
    productId: 'product-1',
    name: 'Shirt',
    quantity: 2,
    price: { regularPriceInCents: 2000, currency: 'EUR', ...price },
  }
}

describe('getUnitPrice', () => {
  it('returns the regular price when there is no discount', () => {
    expect(getUnitPrice(createItem({}))).toBe(2000)
  })

  it('returns the discounted price when present', () => {
    expect(getUnitPrice(createItem({ discountedPriceInCents: 1500 }))).toBe(
      1500
    )
  })

  it('returns a discounted price of 0 instead of the regular price', () => {
    expect(getUnitPrice(createItem({ discountedPriceInCents: 0 }))).toBe(0)
  })
})

describe('formatItemAttributes', () => {
  const labelFor = (key: string) => `label:${key}`

  it('returns an empty string when attributes are missing', () => {
    expect(formatItemAttributes(undefined, labelFor)).toBe('')
  })

  it('returns an empty string when attributes are empty', () => {
    expect(formatItemAttributes({}, labelFor)).toBe('')
  })

  it('joins labelled attributes with a separator', () => {
    expect(formatItemAttributes({ color: 'Blue', size: 'M' }, labelFor)).toBe(
      'label:color: Blue · label:size: M'
    )
  })

  it('passes the original key to labelFor', () => {
    const spy = jest.fn((key: string) => key)
    formatItemAttributes({ Color: 'Blue' }, spy)
    expect(spy).toHaveBeenCalledWith('Color')
  })
})
