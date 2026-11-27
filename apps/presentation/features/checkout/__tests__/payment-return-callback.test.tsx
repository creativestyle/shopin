/**
 * The shop's one payment return route: it hands the provider's parameters to the BFF once; without a payment id it
 * sends the shopper back to pay again; an error shows only translated text.
 */
import { render, screen } from '@testing-library/react'
import { PaymentReturnCallback } from '../payment-return-callback'

const RAW_ERROR =
  '500 Internal Server Error (BFF POST /payment/return, correlationId: abc)'

const mockPush = jest.fn()
jest.mock('@/lib/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))
let mockSearch = new URLSearchParams()
jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearch,
}))
const mockComplete = jest.fn()
let mockError: Error | null = null
jest.mock('../hooks/use-complete-payment-return', () => ({
  useCompletePaymentReturn: () => ({
    completePaymentReturn: mockComplete,
    error: mockError,
    isPending: false,
  }),
}))

beforeEach(() => {
  mockPush.mockReset()
  mockComplete.mockReset()
  mockError = null
})

describe('PaymentReturnCallback', () => {
  it("hands the provider's parameters to the BFF once (the payment id apart)", () => {
    mockSearch = new URLSearchParams({ paymentId: 'cart-1', result: 'paid' })
    const { rerender } = render(<PaymentReturnCallback />)
    rerender(<PaymentReturnCallback />)
    expect(mockComplete).toHaveBeenCalledTimes(1)
    expect(mockComplete).toHaveBeenCalledWith({
      paymentId: 'cart-1',
      params: { result: 'paid' },
    })
  })

  it('without a payment id: back to pay again, nothing asked', () => {
    mockSearch = new URLSearchParams({ result: 'paid' })
    render(<PaymentReturnCallback />)
    expect(mockComplete).not.toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/checkout/review?paymentFailed=true')
  })

  it('shows only translated text when the return fails', () => {
    mockSearch = new URLSearchParams({ paymentId: 'cart-1' })
    mockError = new Error(RAW_ERROR)
    const { container } = render(<PaymentReturnCallback />)
    expect(screen.getByText('checkout.orderCreationError')).toBeInTheDocument()
    expect(container).not.toHaveTextContent('BFF POST')
    expect(container).not.toHaveTextContent('500')
    expect(container).not.toHaveTextContent('abc')
  })
})
