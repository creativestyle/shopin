import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { markRegistrationCompleted } from '@/features/auth/auth-registration-flag'
import { RegistrationSuccessWithHref } from '../registration-success-with-href'

const mockPush = jest.fn()
let mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useSearchParams: () => mockSearchParams,
}))

jest.mock('@/lib/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('RegistrationSuccessWithHref', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    mockSearchParams = new URLSearchParams('token=abc&returnTo=%2Fcheckout')
  })

  it('redirects home when the user did not just register', () => {
    render(<RegistrationSuccessWithHref />)

    expect(mockPush).toHaveBeenCalledWith('/')
    expect(
      screen.queryByText('account.registrationSuccess.title')
    ).not.toBeInTheDocument()
  })

  it('shows the success copy and verify-email link after registration', () => {
    markRegistrationCompleted()
    render(<RegistrationSuccessWithHref />)

    expect(mockPush).not.toHaveBeenCalled()
    expect(
      screen.getByText('account.registrationSuccess.title')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: 'account.registrationSuccess.confirmButton',
      })
    ).toHaveAttribute(
      'href',
      '/sign-up/verify-email?token=abc&returnTo=%2Fcheckout'
    )
  })
})
