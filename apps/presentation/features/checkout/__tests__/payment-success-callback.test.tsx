import { render, screen } from '@testing-library/react'
import { PaymentSuccessCallback } from '../payment-success-callback'

const RAW_ERROR =
  '500 Internal Server Error (BFF POST /order, correlationId: abc)'

jest.mock('@/lib/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/features/cart/cart-use-cart', () => ({
  useCart: () => ({ cart: { id: 'cart-1' } }),
}))

jest.mock('../hooks/use-create-checkout-order', () => ({
  useCreateCheckoutOrder: () => ({
    createOrder: jest.fn(),
    error: new Error(RAW_ERROR),
    isPending: false,
  }),
}))

describe('PaymentSuccessCallback', () => {
  it('shows only translated text when order creation fails', () => {
    const { container } = render(<PaymentSuccessCallback />)

    expect(screen.getByText('checkout.orderCreationError')).toBeInTheDocument()
    expect(container).not.toHaveTextContent('BFF POST')
    expect(container).not.toHaveTextContent('500')
    expect(container).not.toHaveTextContent('abc')
  })
})
