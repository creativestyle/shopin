/**
 * A delivery method's price shows its currency's own decimals, as before the neutral price contract (issue #345,
 * criterion 19): the item does not pass the price's `fractionDigits` on, so an integration's value (a commerce
 * platform may send 2 when its money omits it) never changes what the shopper sees.
 */
import { render, screen } from '@testing-library/react'
import type { ShippingMethodResponse } from '@core/contracts/cart/shipping-method'
import { RadioGroup } from '@/components/ui/radio-button'
import { DeliveryMethodItem } from '../components/delivery-method/delivery-method-item'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}))
jest.mock('@/features/cart/cart-use-cart', () => ({
  useCart: () => ({ cart: undefined }),
}))

function priceShown(price: ShippingMethodResponse['price']): string {
  const method: ShippingMethodResponse = {
    id: 'standard',
    name: 'Standard',
    price,
  }
  render(
    <RadioGroup value='standard'>
      <DeliveryMethodItem
        method={method}
        selectedMethod='standard'
      />
    </RadioGroup>
  )
  return screen.getByText(/^\+/).textContent ?? ''
}

describe('DeliveryMethodItem price', () => {
  it('a currency without decimals (JPY) shows none, whatever fractionDigits says', () => {
    expect(
      priceShown({
        regularPriceInCents: 50000,
        currency: 'JPY',
        fractionDigits: 2,
      })
    ).toBe('+¥500')
  })

  it('a currency with two decimals (EUR) shows two, whatever fractionDigits says', () => {
    expect(
      priceShown({
        regularPriceInCents: 495,
        currency: 'EUR',
        fractionDigits: 0,
      })
    ).toBe('+€4.95')
  })

  it('a currency with two decimals (EUR) and its own fractionDigits', () => {
    expect(
      priceShown({
        regularPriceInCents: 495,
        currency: 'EUR',
        fractionDigits: 2,
      })
    ).toBe('+€4.95')
  })
})
