import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignUpFormWithRedirect } from '../sign-up-form-with-redirect'

const mockPush = jest.fn()
let mockSearchParams = new URLSearchParams()

jest.mock('@/lib/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useSearchParams: () => mockSearchParams,
}))

jest.mock('@/features/auth/auth-register-form', () => ({
  RegisterForm: ({ onSuccess }: { onSuccess?: (token?: string) => void }) => (
    <button onClick={() => onSuccess?.('tok')}>register</button>
  ),
}))

describe('SignUpFormWithRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
  })

  it('redirects to the success page with the email token', async () => {
    mockSearchParams = new URLSearchParams()
    render(<SignUpFormWithRedirect />)

    await userEvent.click(screen.getByRole('button', { name: 'register' }))

    expect(mockPush).toHaveBeenCalledWith('/sign-up/success?token=tok')
    expect(sessionStorage.getItem('registration-completed')).toBe('true')
  })

  it('keeps the returnTo param', async () => {
    mockSearchParams = new URLSearchParams('returnTo=%2Fcheckout')
    render(<SignUpFormWithRedirect />)

    await userEvent.click(screen.getByRole('button', { name: 'register' }))

    expect(mockPush).toHaveBeenCalledWith(
      '/sign-up/success?token=tok&returnTo=%2Fcheckout'
    )
  })
})
