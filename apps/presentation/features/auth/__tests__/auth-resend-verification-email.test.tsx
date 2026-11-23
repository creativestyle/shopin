import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ResendVerificationEmailForm } from '../auth-resend-verification-email'

const mockResend = jest.fn()

jest.mock('../hooks/use-auth-service', () => ({
  useAuthService: () => ({
    authService: { resendVerificationEmail: mockResend },
  }),
}))

const NS = 'account.registrationSuccess'

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <ResendVerificationEmailForm />
    </QueryClientProvider>
  )
  return userEvent.setup()
}

async function submit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByLabelText(`${NS}.resendEmailLabel`, { exact: false }),
    'john@example.com'
  )
  await user.click(screen.getByRole('button', { name: `${NS}.resendButton` }))
}

describe('ResendVerificationEmailForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('announces success in a status region that was mounted before submit', async () => {
    mockResend.mockResolvedValue({ success: true })
    const user = renderForm()
    const status = screen.getByRole('status')
    expect(status).toBeEmptyDOMElement()

    await submit(user)

    expect(await screen.findByText(`${NS}.resendSuccess`)).toBe(status)
    expect(screen.getByRole('status')).toBe(status)
  })

  it('announces a failure as an alert', async () => {
    mockResend.mockRejectedValue(new Error('500'))
    const user = renderForm()

    await submit(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      `${NS}.errors.resendFailed`
    )
  })
})
