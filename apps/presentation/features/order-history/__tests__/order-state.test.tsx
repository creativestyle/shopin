/**
 * The order states a shopper sees did not change with the neutral order status (issue #345, criteria 15 and 25):
 * the same states, texts, badge colours and progress steps as before.
 */
import { render, screen } from '@testing-library/react'
import { OrderStateSchema } from '@core/contracts/order/order'
import enUS from '@core/i18n/en-US.json'
import deDE from '@core/i18n/de-DE.json'
import { OrderStateBadge } from '../components/order-state-badge'
import { STATE_TO_STEP_INDEX } from '../lib/order-status-progress-utils'

// state → en-US text, de-DE text, badge colour, progress step (3 = all three steps done, -1 = cancelled)
const SHOWN = {
  Open: ['Open', 'Offen', 'bg-blue-100', 0],
  Confirmed: ['Confirmed', 'Bestätigt', 'bg-gray-100', 1],
  Processing: ['Processing', 'In Bearbeitung', 'bg-orange-100', 1],
  Shipped: ['Shipped', 'Versendet', 'bg-orange-100', 2],
  Complete: ['Complete', 'Abgeschlossen', 'bg-green-100', 3],
  Delivered: ['Delivered', 'Zugestellt', 'bg-green-100', 3],
  Cancelled: ['Cancelled', 'Storniert', 'bg-red-100', -1],
} as const

describe('order states the shopper sees', () => {
  it('are the same states as before', () => {
    expect(OrderStateSchema.options).toEqual(Object.keys(SHOWN))
  })

  it.each(Object.entries(SHOWN))(
    '%s keeps its texts, badge colour and progress step',
    (state, [en, de, colour, step]) => {
      const key = state as keyof typeof SHOWN

      expect(enUS.orderHistory.orderState[key]).toBe(en)
      expect(deDE.orderHistory.orderState[key]).toBe(de)
      expect(STATE_TO_STEP_INDEX[key]).toBe(step)

      render(<OrderStateBadge state={key} />)
      expect(screen.getByText(`orderHistory.orderState.${key}`)).toHaveClass(
        colour
      )
    }
  )
})
