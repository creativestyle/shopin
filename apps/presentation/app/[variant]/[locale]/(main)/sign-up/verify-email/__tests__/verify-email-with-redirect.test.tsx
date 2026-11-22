import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VerifyEmailWithRedirect } from '../verify-email-with-redirect'

const mockReplace = jest.fn()
let mockSearchParams = new URLSearchParams()

jest.mock('@/lib/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useSearchParams: () => mockSearchParams,
}))

jest.mock('@/features/auth/auth-confirm-email', () => ({
  ConfirmEmail: ({ onVerified }: { onVerified?: () => void }) => (
    <button onClick={() => onVerified?.()}>verify</button>
  ),
}))

describe('VerifyEmailWithRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to sign-in with the verified flag', async () => {
    mockSearchParams = new URLSearchParams('token=abc')
    render(<VerifyEmailWithRedirect />)

    await userEvent.click(screen.getByRole('button', { name: 'verify' }))

    expect(mockReplace).toHaveBeenCalledWith('/sign-in?verified=true')
  })

  it('keeps the checkout param', async () => {
    mockSearchParams = new URLSearchParams('token=abc&isCheckout=true')
    render(<VerifyEmailWithRedirect />)

    await userEvent.click(screen.getByRole('button', { name: 'verify' }))

    expect(mockReplace).toHaveBeenCalledWith(
      '/sign-in?verified=true&isCheckout=true'
    )
  })
})
