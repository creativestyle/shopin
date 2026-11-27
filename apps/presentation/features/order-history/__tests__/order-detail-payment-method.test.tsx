/**
 * The order's payment method row, as before the neutral payment contract (issue #345, criterion 19): shown when the
 * order has a payment (before: its first payment's method info), with the method's name in the page's language,
 * else the method, else "not available" (an integration that knows no method sends an empty `method`).
 */
import { render, screen } from '@testing-library/react'
import type { OrderResponse } from '@core/contracts/order/order'
import { OrderDetailStatusCard } from '../components/order-detail-status-card'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

const order = (paymentInfo?: OrderResponse['paymentInfo']) =>
  ({
    id: 'order-1',
    createdAt: '2026-11-27T10:00:00.000Z',
    orderState: 'Open',
    ...(paymentInfo ? { paymentInfo } : {}),
  }) as unknown as OrderResponse

/** The text under the "payment method" label, or null when the row is not shown. */
function paymentRow(o: OrderResponse): string | null {
  render(
    <OrderDetailStatusCard
      order={o}
      locale='en-US'
    />
  )
  const label = screen.queryByText('paymentMethod')
  return label ? (label.nextElementSibling?.textContent ?? '') : null
}

describe('order detail: payment method row', () => {
  it('is not shown without a payment', () => {
    expect(paymentRow(order())).toBeNull()
  })

  it("shows the method's name in the page's language", () => {
    expect(
      paymentRow(
        order({
          method: 'invoice',
          provider: 'mock',
          name: { 'en-US': 'Invoice', 'de-DE': 'Rechnung' },
          status: 'paid',
        })
      )
    ).toBe('Invoice')
  })

  it('shows the method without a name in that language', () => {
    expect(
      paymentRow(
        order({
          method: 'invoice',
          provider: 'mock',
          name: { 'de-DE': 'Rechnung' },
          status: 'paid',
        })
      )
    ).toBe('invoice')
  })

  it('shows "not available" for a payment without a method', () => {
    expect(
      paymentRow(order({ method: '', provider: '', status: 'pending' }))
    ).toBe('notAvailable')
  })
})
