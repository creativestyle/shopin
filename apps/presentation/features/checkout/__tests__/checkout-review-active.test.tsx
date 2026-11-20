import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReviewActive } from '../checkout-review-active'

const mockHandleInitiatePayment = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => '/checkout/review',
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('@/features/cart/cart-use-cart', () => ({
  useCart: () => ({ cart: { id: 'cart-1' } }),
}))

jest.mock('../hooks/use-initiate-payment', () => ({
  useInitiatePayment: () => ({
    handleInitiatePayment: mockHandleInitiatePayment,
    isPending: false,
  }),
}))

jest.mock('@/components/ui/toast', () => ({
  addToast: jest.fn(),
}))

const TERMS_ERROR = 'checkout.steps.review.termsRequired'
const BUY_NOW = 'checkout.steps.review.buyNow'

describe('ReviewActive', () => {
  beforeEach(() => {
    mockHandleInitiatePayment.mockReset()
    mockHandleInitiatePayment.mockResolvedValue(null)
  })

  it('renders no error state initially', () => {
    render(<ReviewActive />)

    const checkbox = screen.getByRole('checkbox')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(checkbox).not.toHaveAttribute('aria-invalid')
    expect(checkbox).not.toHaveAttribute('aria-describedby')
  })

  it('shows a single linked alert when placing order without accepting terms', async () => {
    const user = userEvent.setup()
    render(<ReviewActive />)

    await user.click(screen.getByRole('button', { name: BUY_NOW }))

    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toHaveTextContent(TERMS_ERROR)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('aria-invalid', 'true')
    expect(checkbox).toHaveAttribute('aria-describedby', alerts[0].id)
    expect(mockHandleInitiatePayment).not.toHaveBeenCalled()
  })

  it('clears the error when terms are accepted', async () => {
    const user = userEvent.setup()
    render(<ReviewActive />)

    await user.click(screen.getByRole('button', { name: BUY_NOW }))
    await user.click(screen.getByRole('checkbox'))

    const checkbox = screen.getByRole('checkbox')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(checkbox).not.toHaveAttribute('aria-invalid')
    expect(checkbox).not.toHaveAttribute('aria-describedby')
  })

  it('initiates payment when terms are accepted', async () => {
    const user = userEvent.setup()
    render(<ReviewActive />)

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: BUY_NOW }))

    expect(mockHandleInitiatePayment).toHaveBeenCalledWith('cart-1')
  })
})
