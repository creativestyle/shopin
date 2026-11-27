import { render, screen } from '@testing-library/react'
import { AuthPageGuard } from '../auth-page-guard'

const mockPush = jest.fn()
let mockSearchParams = new URLSearchParams()
let mockCustomer = { isLoggedIn: false, isLoading: false }

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useSearchParams: () => mockSearchParams,
}))

jest.mock('@/lib/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/features/customer/customer-use-customer', () => ({
  useCustomer: () => mockCustomer,
}))

function renderGuard(isVerifiedOnServer?: boolean) {
  render(
    <AuthPageGuard isVerifiedOnServer={isVerifiedOnServer}>
      <p>auth content</p>
    </AuthPageGuard>
  )
}

describe('AuthPageGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams = new URLSearchParams()
    mockCustomer = { isLoggedIn: false, isLoading: false }
  })

  it('renders children for a guest', () => {
    renderGuard()

    expect(screen.getByText('auth content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not redirect while the customer is loading', () => {
    mockCustomer = { isLoggedIn: false, isLoading: true }
    renderGuard()

    expect(screen.queryByText('auth content')).not.toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('redirects a logged-in user to the account overview by default', () => {
    mockCustomer = { isLoggedIn: true, isLoading: false }
    renderGuard()

    expect(mockPush).toHaveBeenCalledWith('/account')
  })

  it('redirects a logged-in user to returnTo', () => {
    mockCustomer = { isLoggedIn: true, isLoading: false }
    mockSearchParams = new URLSearchParams('returnTo=%2Fcheckout')
    renderGuard()

    expect(mockPush).toHaveBeenCalledWith('/checkout')
  })

  it('falls back to the account overview for an unsafe returnTo', () => {
    mockCustomer = { isLoggedIn: true, isLoading: false }
    mockSearchParams = new URLSearchParams('returnTo=%2F%2Fevil.com')
    renderGuard()

    expect(mockPush).toHaveBeenCalledWith('/account')
  })

  it('falls back to the account overview for a returnTo with a control character', () => {
    mockCustomer = { isLoggedIn: true, isLoading: false }
    mockSearchParams = new URLSearchParams('returnTo=%2F%09%2Fevil.com')
    renderGuard()

    expect(mockPush).toHaveBeenCalledWith('/account')
  })

  it('renders children while loading when the server saw a guest', () => {
    mockCustomer = { isLoggedIn: false, isLoading: true }
    renderGuard(true)

    expect(screen.getByText('auth content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })
})
