import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CheckoutAccountSelection } from '../checkout-account-selection'

const mockPush = jest.fn()
let mockCustomer = { isLoggedIn: false, isLoading: false }

jest.mock('@/lib/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/features/customer/customer-use-customer', () => ({
  useCustomer: () => mockCustomer,
}))

jest.mock('@/features/auth/auth-login-form', () => ({
  LoginForm: () => <form aria-label='login' />,
}))

describe('CheckoutAccountSelection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCustomer = { isLoggedIn: false, isLoading: false }
  })

  it('sends create-account to sign-up with checkout as returnTo', async () => {
    const user = userEvent.setup()
    render(<CheckoutAccountSelection />)

    await user.click(
      screen.getByRole('button', { name: 'checkout.createAccount.button' })
    )

    expect(mockPush).toHaveBeenCalledWith('/sign-up?returnTo=%2Fcheckout')
  })

  it('sends a guest to billing', async () => {
    const user = userEvent.setup()
    render(<CheckoutAccountSelection />)

    await user.click(
      screen.getByRole('button', { name: 'checkout.guest.button' })
    )

    expect(mockPush).toHaveBeenCalledWith('/checkout/billing', {
      scroll: false,
    })
  })

  it('sends a signed-in customer straight to billing', () => {
    mockCustomer = { isLoggedIn: true, isLoading: false }
    render(<CheckoutAccountSelection />)

    expect(mockPush).toHaveBeenCalledWith('/checkout/billing', {
      scroll: false,
    })
  })
})
