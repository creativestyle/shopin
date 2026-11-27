import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { format } from 'node:util'
import cartMappers from '../dist/mappers/cart.js'

const { mapCartToResponse, mapDiscountCodes, mapPaymentInfo } = cartMappers

const money = (centAmount) => ({ centAmount, currencyCode: 'EUR' })

function lineItem(overrides = {}) {
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
    assert.deepEqual(
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
      ]),
      [
        { id: 'dc-1', code: 'SAVE10', applied: true },
        { id: 'dc-2', code: 'OLD', applied: false },
      ]
    )
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
    }

    const result = mapCartToResponse(cart, 'en-US')

    assert.equal(result.subtotal.regularPriceInCents, 2000)
    assert.equal(result.discountAmount?.regularPriceInCents, 200)
    assert.equal(result.grandTotal.regularPriceInCents, 1800)
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
    }

    const result = mapCartToResponse(cart, 'en-US')

    assert.equal(result.subtotal.regularPriceInCents, 2000)
    assert.equal(result.discountAmount?.regularPriceInCents, 700)
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
    }

    const result = mapCartToResponse(cart, 'en-US')

    assert.equal(result.discountAmount?.regularPriceInCents, 500)
    assert.equal(result.shippingInfo?.price.regularPriceInCents, 500)
    assert.equal(
      result.subtotal.regularPriceInCents -
        (result.discountAmount?.regularPriceInCents ?? 0) +
        (result.shippingInfo?.price.regularPriceInCents ?? 0),
      result.grandTotal.regularPriceInCents
    )
  })

  it('reports no discount when none applies', () => {
    const cart = {
      id: 'cart-1',
      version: 1,
      totalPrice: money(2000),
      lineItems: [lineItem()],
    }

    assert.equal(mapCartToResponse(cart, 'en-US').discountAmount, undefined)
  })
})

describe('payment info: one flat summary, never the commercetools payment record', () => {
  const payment = (transactions) => ({
    payments: [
      {
        typeId: 'payment',
        id: 'pay-1',
        obj: {
          version: 3,
          paymentMethodInfo: {
            method: 'credit-card',
            paymentInterface: 'adyen',
            name: { en: 'Card' },
          },
          ...(transactions
            ? {
                transactions: transactions.map((t, i) => ({
                  id: `t${i}`,
                  amount: { centAmount: 1999, currencyCode: 'EUR' },
                  ...t,
                })),
              }
            : {}),
          amountPlanned: { centAmount: 1999, currencyCode: 'EUR' },
        },
      },
    ],
  })

  for (const [transactions, status] of [
    [[{ type: 'Charge', state: 'Success' }], 'paid'],
    [[{ type: 'Authorization', state: 'Success' }], 'authorized'],
    [[{ type: 'Charge', state: 'Failure' }], 'failed'],
    [[{ type: 'Charge', state: 'Pending' }], 'pending'],
    [undefined, 'pending'],
    // led by the latest successful transaction
    [
      [
        { type: 'Authorization', state: 'Success' },
        { type: 'CancelAuthorization', state: 'Success' },
      ],
      'cancelled',
    ],
    [
      [
        { type: 'Authorization', state: 'Success' },
        { type: 'CancelAuthorization', state: 'Failure' },
      ],
      'authorized',
    ],
    [
      [
        { type: 'Authorization', state: 'Success' },
        { type: 'CancelAuthorization', state: 'Success' },
        { type: 'Authorization', state: 'Success' },
      ],
      'authorized',
    ],
    [
      [
        { type: 'Charge', state: 'Success' },
        { type: 'Refund', state: 'Success' },
      ],
      'cancelled',
    ],
    [
      [
        { type: 'Charge', state: 'Success' },
        { type: 'Chargeback', state: 'Success' },
      ],
      'cancelled',
    ],
    [
      [
        { type: 'Charge', state: 'Success' },
        {
          type: 'Refund',
          state: 'Success',
          amount: { centAmount: 500, currencyCode: 'EUR' },
        },
      ],
      'paid',
    ],
    [
      [
        { type: 'Charge', state: 'Success' },
        {
          type: 'Refund',
          state: 'Success',
          amount: { centAmount: 999, currencyCode: 'EUR' },
        },
        {
          type: 'Refund',
          state: 'Success',
          amount: { centAmount: 1000, currencyCode: 'EUR' },
        },
      ],
      'cancelled',
    ],
    [
      [
        { type: 'Charge', state: 'Success' },
        { type: 'Refund', state: 'Failure' },
      ],
      'paid',
    ],
    // a partial capture, then the rest of the authorization released (split shipment): charged money is kept
    [
      [
        { type: 'Authorization', state: 'Success' },
        {
          type: 'Charge',
          state: 'Success',
          amount: { centAmount: 1200, currencyCode: 'EUR' },
        },
        {
          type: 'CancelAuthorization',
          state: 'Success',
          amount: { centAmount: 799, currencyCode: 'EUR' },
        },
      ],
      'paid',
    ],
    [
      [
        { type: 'Authorization', state: 'Success' },
        {
          type: 'Charge',
          state: 'Success',
          amount: { centAmount: 1200, currencyCode: 'EUR' },
        },
        {
          type: 'Refund',
          state: 'Success',
          amount: { centAmount: 200, currencyCode: 'EUR' },
        },
        {
          type: 'CancelAuthorization',
          state: 'Success',
          amount: { centAmount: 799, currencyCode: 'EUR' },
        },
      ],
      'paid',
    ],
    // everything charged was given back before the rest was released: nothing is paid
    [
      [
        { type: 'Authorization', state: 'Success' },
        {
          type: 'Charge',
          state: 'Success',
          amount: { centAmount: 1200, currencyCode: 'EUR' },
        },
        {
          type: 'Refund',
          state: 'Success',
          amount: { centAmount: 1200, currencyCode: 'EUR' },
        },
        {
          type: 'CancelAuthorization',
          state: 'Success',
          amount: { centAmount: 799, currencyCode: 'EUR' },
        },
      ],
      'cancelled',
    ],
  ]) {
    it(format('transactions %j → %s', transactions, status), () => {
      assert.deepEqual(mapPaymentInfo(payment(transactions)), {
        method: 'credit-card',
        provider: 'adyen',
        name: { en: 'Card' },
        status,
        amount: {
          regularPriceInCents: 1999,
          currency: 'EUR',
          fractionDigits: 2,
        },
      })
    })
  }

  it('no payment: no summary', () => {
    assert.equal(mapPaymentInfo({ payments: [] }), undefined)
    assert.equal(mapPaymentInfo(undefined), undefined)
  })
})
