import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { addToast } from '@/components/ui/toast'
import { ChangePasswordForm } from '../customer-change-password-form'
import { InvalidCurrentPasswordError } from '../lib/invalid-current-password-error'

const mockChangePassword = jest.fn()

jest.mock('../hooks/use-customer-service', () => ({
  useCustomerService: () => ({
    customerService: { changePassword: mockChangePassword },
  }),
}))

jest.mock('@/lib/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/components/ui/toast', () => ({
  ...jest.requireActual('@/components/ui/toast'),
  addToast: jest.fn(),
}))

const NS = 'account.myAccount.changePassword'

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <ChangePasswordForm />
    </QueryClientProvider>
  )
  return userEvent.setup()
}

function input(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement
}

async function submitValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(input('currentPassword'), 'oldpass123')
  await user.type(input('newPassword'), 'newpass123')
  await user.type(input('confirmNewPassword'), 'newpass123')
  await user.click(
    screen.getByRole('button', { name: `${NS}.submitButtonLabel` })
  )
}

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows a wrong current password on the field, focuses it and shows no toast', async () => {
    mockChangePassword.mockRejectedValue(new InvalidCurrentPasswordError())
    const user = renderForm()

    await submitValidForm(user)

    expect(
      await screen.findByText(`${NS}.errors.wrongCurrentPassword`)
    ).toBeInTheDocument()
    expect(input('currentPassword')).toHaveFocus()
    expect(input('currentPassword')).toHaveAttribute('aria-invalid', 'true')
    expect(addToast).not.toHaveBeenCalled()
  })

  it('shows the generic error toast for any other failure', async () => {
    mockChangePassword.mockRejectedValue(new Error('500 Internal Server Error'))
    const user = renderForm()

    await submitValidForm(user)

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        type: 'error',
        children: `${NS}.passwordChangeError`,
      })
    )
    expect(
      screen.queryByText(`${NS}.errors.wrongCurrentPassword`)
    ).not.toBeInTheDocument()
  })

  it('renders the password hint and links it to the new password input', () => {
    renderForm()

    const hint = screen.getByText('account.passwordHint')

    expect(hint.id).toBeTruthy()
    expect(input('newPassword').getAttribute('aria-describedby')).toContain(
      hint.id
    )
  })

  it('re-validates the confirmation when the new password changes', async () => {
    const user = renderForm()

    await user.type(input('newPassword'), 'newpass123')
    await user.type(input('confirmNewPassword'), 'newpass123')
    await user.tab()
    expect(
      screen.queryByText(`${NS}.errors.passwordsDoNotMatch`)
    ).not.toBeInTheDocument()

    await user.type(input('newPassword'), '4')

    expect(
      await screen.findByText(`${NS}.errors.passwordsDoNotMatch`)
    ).toBeInTheDocument()
  })
})
