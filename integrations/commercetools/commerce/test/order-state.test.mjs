/**
 * Order status is a small neutral enum each integration maps to (issue #345, criterion 25): commercetools'
 * orderState + shipmentState land on one of the storefront's states (the ones it showed before the change, criterion
 * 15), and its own states stay in `orderStateDetail`.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import orderContract from '@core/contracts/order/order'
import orderMapper from '../dist/mappers/order.js'

const { OrderStateSchema, OrderResponseSchema, OrderSummaryResponseSchema } =
  orderContract
const { mapOrderToResponse, mapOrderToSummary } = orderMapper

function ctOrder(orderState, shipmentState) {
  return {
    id: 'order-1',
    version: 1,
    orderNumber: '1001',
    createdAt: '2026-01-01T00:00:00.000Z',
    orderState,
    shipmentState,
    lineItems: [],
    totalPrice: { centAmount: 500, currencyCode: 'EUR' },
  }
}

describe('neutral order state', () => {
  it('is the storefront states the shopper saw before, nothing added', () => {
    assert.deepEqual(OrderStateSchema.options, [
      'Open',
      'Confirmed',
      'Processing',
      'Shipped',
      'Complete',
      'Delivered',
      'Cancelled',
    ])
  })

  it('has no provider field on the order summary', () => {
    assert.equal(
      Object.hasOwn(OrderSummaryResponseSchema.shape, 'source'),
      false
    )
  })

  for (const [orderState, shipmentState, expected] of [
    ['Open', undefined, 'Open'],
    ['Confirmed', undefined, 'Processing'],
    ['Confirmed', 'Ready', 'Processing'],
    ['Confirmed', 'Shipped', 'Shipped'],
    ['Confirmed', 'Delivered', 'Delivered'],
    ['Open', 'Delivered', 'Delivered'],
    ['Complete', 'Delivered', 'Complete'],
    ['Cancelled', 'Shipped', 'Cancelled'],
  ]) {
    it(`maps commercetools ${orderState}/${shipmentState ?? '-'} to ${expected}`, () => {
      const order = mapOrderToResponse(
        ctOrder(orderState, shipmentState),
        'en-US'
      )
      const summary = mapOrderToSummary(
        ctOrder(orderState, shipmentState),
        'en-US'
      )

      assert.equal(order.orderState, expected)
      assert.equal(summary.orderState, expected)
      assert.equal(OrderStateSchema.safeParse(order.orderState).success, true)
    })
  }

  it('keeps commercetools’ own states in the detail field', () => {
    const order = mapOrderToResponse(ctOrder('Confirmed', 'Delivered'), 'en-US')

    assert.equal(order.orderState, 'Delivered')
    assert.equal(order.orderStateDetail, 'order Confirmed, shipment Delivered')
  })

  it('maps an order the order contract accepts', () => {
    const order = mapOrderToResponse(ctOrder('Open', 'Delivered'), 'en-US')

    assert.equal(OrderResponseSchema.safeParse(order).success, true)
  })
})
