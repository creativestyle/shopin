import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ResetPasswordForm } from '../auth-reset-password-form'

const mockResetPassword = jest.fn()

jest.mock('../hooks/use-auth-service', () => ({
  useAuthService: () => ({
    authService: { resetPassword: mockResetPassword },
  }),
}))

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useSearchParams: () => new URLSearchParams('token=abc'),
}))

const NS = 'account.resetPassword'

function renderForm(onSuccess?: () => void) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <ResetPasswordForm onSuccess={onSuccess} />
    </QueryClientProvider>
  )
  return userEvent.setup()
}

async function submitValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    document.getElementById('newPassword') as HTMLInputElement,
    'newpass123'
  )
  await user.type(
    document.getElementById('confirmPassword') as HTMLInputElement,
    'newpass123'
  )
  await user.click(screen.getByRole('button', { name: `${NS}.submitButton` }))
}

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows the invalid-token message with a request-new-link link', async () => {
    mockResetPassword.mockResolvedValue({
      success: false,
      statusCode: 400,
      message: 'token_invalid',
    })
    const user = renderForm()

    await submitValidForm(user)

    expect(
      await screen.findByText(`${NS}.errors.invalidToken`)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: `${NS}.requestNewLink` })
    ).toHaveAttribute('href', '/forgot-password')
  })

  it('shows the expired-token message for an expired token', async () => {
    mockResetPassword.mockResolvedValue({
      success: false,
      statusCode: 400,
      message: 'token_expired',
    })
    const user = renderForm()

    await submitValidForm(user)

    expect(
      await screen.findByText(`${NS}.errors.expiredToken`)
    ).toBeInTheDocument()
  })

  it('keeps the form with a generic error for a 400 without a token message', async () => {
    mockResetPassword.mockResolvedValue({ success: false, statusCode: 400 })
    const user = renderForm()

    await submitValidForm(user)

    expect(
      await screen.findByText(`${NS}.errors.resetPasswordFailed`)
    ).toBeInTheDocument()
    expect(
      screen.queryByText(`${NS}.errors.invalidToken`)
    ).not.toBeInTheDocument()
  })

  it('calls onSuccess after a successful reset', async () => {
    mockResetPassword.mockResolvedValue({ success: true })
    const onSuccess = jest.fn()
    const user = renderForm(onSuccess)

    await submitValidForm(user)

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(mockResetPassword).toHaveBeenCalledWith({
      tokenValue: 'abc',
      newPassword: 'newpass123',
    })
  })
})
