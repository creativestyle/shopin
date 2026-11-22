import {
  mapCartToResponse,
  mapDiscountCodes,
  type CartApiResponse,
} from '@integrations/commercetools-api'

const money = (centAmount: number) => ({ centAmount, currencyCode: 'EUR' })

type LineItem = NonNullable<CartApiResponse['lineItems']>[number]

function lineItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: 'li-1',
    productId: 'p-1',
    quantity: 2,
    price: { value: money(1000) },
    totalPrice: money(2000),
    ...overrides,
  }
}

describe('mapDiscountCodes', () => {
  it('marks only MatchesCart codes as applied', () => {
    expect(
      mapDiscountCodes([
        {
          discountCode: {
            typeId: 'discount-code',
            id: 'dc-1',
            obj: { code: 'SAVE10' },
          },
          state: 'MatchesCart',
        },
        {
          discountCode: {
            typeId: 'discount-code',
            id: 'dc-2',
            obj: { code: 'OLD' },
          },
          state: 'DoesNotMatchCart',
        },
      ])
    ).toEqual([
      { id: 'dc-1', code: 'SAVE10', applied: true },
      { id: 'dc-2', code: 'OLD', applied: false },
    ])
  })
})

describe('mapCartToResponse discounts', () => {
  it('reports line item cart discounts and keeps the subtotal undiscounted', () => {
    const cart = {
      id: 'cart-1',
      version: 1,
      totalPrice: money(1800),
      lineItems: [
        lineItem({
          totalPrice: money(1800),
          discountedPricePerQuantity: [
            {
              quantity: 2,
              discountedPrice: {
                includedDiscounts: [{ discountedAmount: money(100) }],
              },
            },
          ],
        }),
      ],
    } as CartApiResponse

    const result = mapCartToResponse(cart, 'en-US')

    expect(result.subtotal.regularPriceInCents).toBe(2000)
    expect(result.discountAmount?.regularPriceInCents).toBe(200)
    expect(result.grandTotal.regularPriceInCents).toBe(1800)
  })

  it('adds a total price discount on top of line item discounts', () => {
    const cart = {
      id: 'cart-1',
      version: 1,
      totalPrice: money(1300),
      discountOnTotalPrice: { discountedAmount: money(500) },
      lineItems: [
        lineItem({
          totalPrice: money(1800),
          discountedPricePerQuantity: [
            {
              quantity: 2,
              discountedPrice: {
                includedDiscounts: [{ discountedAmount: money(100) }],
              },
            },
          ],
        }),
      ],
    } as CartApiResponse

    const result = mapCartToResponse(cart, 'en-US')

    expect(result.subtotal.regularPriceInCents).toBe(2000)
    expect(result.discountAmount?.regularPriceInCents).toBe(700)
  })

  it('counts a shipping discount and keeps the full shipping price', () => {
    const cart = {
      id: 'cart-1',
      version: 1,
      totalPrice: money(2000),
      lineItems: [lineItem()],
      shippingInfo: {
        shippingMethodName: 'Express',
        price: money(500),
        discountedPrice: { value: money(0) },
        shippingMethod: { typeId: 'shipping-method', id: 'sm-1' },
      },
    } as CartApiResponse

    const result = mapCartToResponse(cart, 'en-US')

    expect(result.discountAmount?.regularPriceInCents).toBe(500)
    expect(result.shippingInfo?.price.regularPriceInCents).toBe(500)
    expect(
      result.subtotal.regularPriceInCents -
        (result.discountAmount?.regularPriceInCents ?? 0) +
        (result.shippingInfo?.price.regularPriceInCents ?? 0)
    ).toBe(result.grandTotal.regularPriceInCents)
  })

  it('reports no discount when none applies', () => {
    const cart = {
      id: 'cart-1',
      version: 1,
      totalPrice: money(2000),
      lineItems: [lineItem()],
    } as CartApiResponse

    expect(mapCartToResponse(cart, 'en-US').discountAmount).toBeUndefined()
  })
})
