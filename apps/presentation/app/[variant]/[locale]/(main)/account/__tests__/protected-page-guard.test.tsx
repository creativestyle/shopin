import { render, screen } from '@testing-library/react'
import { ProtectedPageGuard } from '../protected-page-guard'

const mockPush = jest.fn()
let mockPathname = '/account'
let mockCustomer = { isLoggedIn: true, isLoading: false }

jest.mock('@/lib/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}))

jest.mock('@/features/customer/customer-use-customer', () => ({
  useCustomer: () => mockCustomer,
}))

function renderGuard() {
  render(
    <ProtectedPageGuard redirectTo='/sign-in'>
      <p>account content</p>
    </ProtectedPageGuard>
  )
}

describe('ProtectedPageGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPathname = '/account'
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
})
