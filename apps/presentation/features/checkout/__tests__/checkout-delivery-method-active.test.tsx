import { render, screen } from '@testing-library/react'
import type { ShippingMethodResponse } from '@core/contracts/cart/shipping-method'
import { DeliveryMethodActive } from '../checkout-delivery-method-active'

type ShippingMethodsState = {
  data?: { shippingMethods: ShippingMethodResponse[] }
  isLoading: boolean
  error: Error | null
}

let mockShippingMethodsState: ShippingMethodsState

// Interpolates values so rendered copy like "Delivery in {time}" is assertable
jest.mock('next-intl', () => ({
  useTranslations:
    (ns?: string) => (key: string, values?: Record<string, string>) =>
      [ns ? `${ns}.${key}` : key, ...Object.values(values ?? {})].join(' '),
  useLocale: () => 'en-US',
}))

jest.mock('@/features/cart/cart-use-cart', () => ({
  useCart: () => ({
    cart: {
      id: 'cart-1',
      currency: 'USD',
      shippingAddress: { city: 'X' },
      subtotal: { regularPriceInCents: 1000, currency: 'USD' },
    },
  }),
}))

jest.mock('../hooks/use-shipping-methods', () => ({
  useShippingMethods: () => mockShippingMethodsState,
}))

jest.mock('../hooks/use-set-shipping-method', () => ({
  useSetShippingMethod: () => ({
    handleSetShippingMethod: jest.fn(),
    isPending: false,
  }),
}))

jest.mock('../components/checkout-steps-frame/use-checkout-navigation', () => ({
  useCheckoutNavigation: () => ({ handleNextStep: jest.fn() }),
}))

jest.mock(
  '../components/checkout-steps-frame/use-checkout-button-label',
  () => ({ useCheckoutButtonLabel: () => 'Continue' })
)

const LOAD_ERROR = 'checkout.deliveryMethod.loadError'

function method(
  overrides: Partial<ShippingMethodResponse> = {}
): ShippingMethodResponse {
  return {
    id: 'standard',
    name: 'Standard',
    price: { regularPriceInCents: 500, currency: 'USD' },
    ...overrides,
  }
}

describe('DeliveryMethodActive', () => {
  it('shows a spinner while the methods load', () => {
    mockShippingMethodsState = { isLoading: true, error: null }

    render(<DeliveryMethodActive />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })

  it('shows an error when loading fails with no methods loaded', () => {
    mockShippingMethodsState = { isLoading: false, error: new Error('boom') }

    render(<DeliveryMethodActive />)

    expect(screen.getByRole('alert')).toHaveTextContent(LOAD_ERROR)
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })

  it('keeps the loaded methods when a refetch fails', () => {
    mockShippingMethodsState = {
      data: { shippingMethods: [method()] },
      isLoading: false,
      error: new Error('boom'),
    }

    render(<DeliveryMethodActive />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Standard/ })).toBeInTheDocument()
  })

  it('shows the delivery time inside the option label', () => {
    mockShippingMethodsState = {
      data: {
        shippingMethods: [method({ deliveryTime: '2-3 business days' })],
      },
      isLoading: false,
      error: null,
    }

    render(<DeliveryMethodActive />)

    expect(
      screen.getByRole('radio', {
        name: /checkout\.deliveryMethod\.deliveryTime 2-3 business days/,
      })
    ).toBeInTheDocument()
  })
})
