import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProtectedPageGuard } from '../protected-page-guard'

const mockPush = jest.fn()
const mockRefetch = jest.fn()
let mockPathname = '/account'
let mockSearchParams = new URLSearchParams()
let mockCustomer: { isLoggedIn: boolean; isLoading: boolean; error?: Error } = {
  isLoggedIn: true,
  isLoading: false,
}

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useSearchParams: () => mockSearchParams,
}))

jest.mock('@/lib/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}))

jest.mock('@/features/customer/customer-use-customer', () => ({
  useCustomer: () => ({ ...mockCustomer, refetch: mockRefetch }),
}))

function renderGuard(isVerifiedOnServer?: boolean) {
  render(
    <ProtectedPageGuard
      redirectTo='/sign-in'
      isVerifiedOnServer={isVerifiedOnServer}
    >
      <p>account content</p>
    </ProtectedPageGuard>
  )
}

describe('ProtectedPageGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPathname = '/account'
    mockSearchParams = new URLSearchParams()
    mockCustomer = { isLoggedIn: true, isLoading: false }
  })

  it('renders children for a logged-in user', () => {
    renderGuard()

    expect(screen.getByText('account content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not redirect while the customer is loading', () => {
    mockCustomer = { isLoggedIn: false, isLoading: true }
    renderGuard()

    expect(screen.queryByText('account content')).not.toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('redirects a guest to sign-in with the current path as returnTo', () => {
    mockCustomer = { isLoggedIn: false, isLoading: false }
    mockPathname = '/account/orders'
    renderGuard()

    expect(mockPush).toHaveBeenCalledWith(
      '/sign-in?returnTo=%2Faccount%2Forders'
    )
  })

  it('keeps the query string in returnTo', () => {
    mockCustomer = { isLoggedIn: false, isLoading: false }
    mockPathname = '/account/orders'
    mockSearchParams = new URLSearchParams('page=3')
    renderGuard()

    expect(mockPush).toHaveBeenCalledWith(
      '/sign-in?returnTo=%2Faccount%2Forders%3Fpage%3D3'
    )
  })

  it('renders children while loading when the server confirmed the customer', () => {
    mockCustomer = { isLoggedIn: false, isLoading: true }
    renderGuard(true)

    expect(screen.getByText('account content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('still redirects once the client sees no customer', () => {
    mockCustomer = { isLoggedIn: false, isLoading: false }
    renderGuard(true)

    expect(mockPush).toHaveBeenCalledWith('/sign-in?returnTo=%2Faccount')
  })

  it('shows a retry message on a failed query when the server confirmed the customer', async () => {
    const user = userEvent.setup()
    mockCustomer = {
      isLoggedIn: false,
      isLoading: false,
      error: new Error('Failed to fetch customer: 429'),
    }
    renderGuard(true)

    expect(screen.getByRole('status')).toHaveTextContent(
      'account.myAccount.customerLoadError'
    )
    expect(screen.queryByText('account content')).not.toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', {
        name: 'account.myAccount.customerLoadRetry',
      })
    )
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('redirects on a failed query when the server could not decide', () => {
    mockCustomer = {
      isLoggedIn: false,
      isLoading: false,
      error: new Error('Failed to fetch customer: 500'),
    }
    renderGuard()

    expect(mockPush).toHaveBeenCalledWith('/sign-in?returnTo=%2Faccount')
  })
})
