import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfirmEmail } from '../auth-confirm-email'

const mockConfirmEmail = jest.fn()
let mockSearchParams = new URLSearchParams()

jest.mock('../hooks/use-auth-service', () => ({
  useAuthService: () => ({
    authService: {
      confirmEmail: mockConfirmEmail,
      resendVerificationEmail: jest.fn(),
    },
  }),
}))

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useSearchParams: () => mockSearchParams,
}))

const NS = 'account.registrationSuccess'

const queryClient = () =>
  new QueryClient({ defaultOptions: { mutations: { retry: false } } })

function renderConfirmEmail(onVerified?: () => void) {
  const client = queryClient()
  const ui = () => (
    <StrictMode>
      <QueryClientProvider client={client}>
        <ConfirmEmail onVerified={onVerified} />
      </QueryClientProvider>
    </StrictMode>
  )
  const result = render(ui())
  return { rerender: () => result.rerender(ui()) }
}

const backToSignIn = () =>
  screen.queryByRole('link', { name: `${NS}.backToSignIn` })
const resendForm = () =>
  screen.queryByRole('button', { name: `${NS}.resendButton` })

describe('ConfirmEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams = new URLSearchParams('token=abc')
  })

  it('submits a token only once under StrictMode', async () => {
    mockConfirmEmail.mockResolvedValue({ success: true })
    renderConfirmEmail()

    await waitFor(() => expect(mockConfirmEmail).toHaveBeenCalled())
    expect(mockConfirmEmail).toHaveBeenCalledTimes(1)
    expect(mockConfirmEmail).toHaveBeenCalledWith({ tokenValue: 'abc' })
  })

  it('submits a new token that arrives in the same mounted component', async () => {
    mockConfirmEmail.mockResolvedValue({
      success: false,
      statusCode: 400,
      message: 'token_invalid',
    })
    const { rerender } = renderConfirmEmail()
    await screen.findByText(`${NS}.errors.tokenInvalid`)

    mockConfirmEmail.mockResolvedValue({ success: true })
    mockSearchParams = new URLSearchParams('token=new')
    rerender()

    await waitFor(() =>
      expect(mockConfirmEmail).toHaveBeenLastCalledWith({ tokenValue: 'new' })
    )
    expect(mockConfirmEmail).toHaveBeenCalledTimes(2)
  })

  it('calls onVerified on success', async () => {
    mockConfirmEmail.mockResolvedValue({ success: true })
    const onVerified = jest.fn()
    renderConfirmEmail(onVerified)

    await waitFor(() => expect(onVerified).toHaveBeenCalledTimes(1))
  })

  it('shows the sign-in link and the resend form for an invalid token', async () => {
    mockConfirmEmail.mockResolvedValue({
      success: false,
      statusCode: 400,
      message: 'token_invalid',
    })
    renderConfirmEmail()

    expect(
      await screen.findByText(`${NS}.errors.tokenInvalid`)
    ).toBeInTheDocument()
    expect(backToSignIn()).toHaveAttribute('href', '/sign-in')
    expect(resendForm()).toBeInTheDocument()
  })

  it('shows only the resend form for an expired token', async () => {
    mockConfirmEmail.mockResolvedValue({
      success: false,
      statusCode: 400,
      message: 'token_expired',
    })
    renderConfirmEmail()

    expect(
      await screen.findByText(`${NS}.errors.tokenExpired`)
    ).toBeInTheDocument()
    expect(resendForm()).toBeInTheDocument()
    expect(backToSignIn()).not.toBeInTheDocument()
  })

  it('shows the token-required error and no request without a token', () => {
    mockSearchParams = new URLSearchParams()
    renderConfirmEmail()

    expect(screen.getByText(`${NS}.errors.tokenRequired`)).toBeInTheDocument()
    expect(backToSignIn()).toBeInTheDocument()
    expect(mockConfirmEmail).not.toHaveBeenCalled()
  })
})
