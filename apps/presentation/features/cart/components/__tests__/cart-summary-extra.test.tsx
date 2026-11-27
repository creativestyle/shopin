/**
 * The shop's cart fields (slot CartExtra) render under the cart summary on the cart and at checkout, but not in
 * the add-to-cart sheet (variant 'modal'), and never under an order.
 */
import { render, screen } from '@testing-library/react'
import type { CartResponse } from '@core/contracts/cart/cart'
import { CartSummary } from '../cart-summary'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en-US',
}))
jest.mock('../promo-code-section', () => ({ PromoCodeSection: () => null }))
jest.mock('../cart-total-display', () => ({ CartTotalDisplay: () => null }))
jest.mock('../price-row', () => ({ PriceRow: () => null }))
// the slot as the storefront mounts it, without its cart service (setFields is not under test here)
jest.mock('../cart-extra', () => ({
  ShopCartExtra: () => <p>gift message form</p>,
}))

const money = { regularPriceInCents: 1000, currency: 'EUR', fractionDigits: 2 }
const cart = {
  id: 'cart-1',
  currency: 'EUR',
  subtotal: money,
  grandTotal: money,
  discountCodes: [],
} as unknown as CartResponse

describe('CartSummary and the CartExtra slot', () => {
  it.each(['default', 'checkout'] as const)(
    'renders the shop cart fields in the %s summary',
    (variant) => {
      render(
        <CartSummary
          cart={cart}
          variant={variant}
        />
      )
      expect(screen.getByText('gift message form')).toBeInTheDocument()
    }
  )

  it('leaves them out of the add-to-cart sheet (modal)', () => {
    render(
      <CartSummary
        cart={cart}
        variant='modal'
      />
    )
    expect(screen.queryByText('gift message form')).toBeNull()
  })

  it('leaves them out under an order', () => {
    render(
      <CartSummary
        cart={{ ...cart, orderNumber: 'A-1' } as unknown as CartResponse}
      />
    )
    expect(screen.queryByText('gift message form')).toBeNull()
  })
})
