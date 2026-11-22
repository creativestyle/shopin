import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { addToast } from '@/components/ui/toast'
import { ChangeEmailForm } from '../customer-change-email-form'
import { customerKeys } from '../customer-keys'
import { InvalidCurrentPasswordError } from '../lib/invalid-current-password-error'
import { EmailInUseError } from '../lib/email-in-use-error'
import { EmailUnchangedError } from '../lib/email-unchanged-error'

const mockChangeEmail = jest.fn()

jest.mock('../hooks/use-customer-service', () => ({
  useCustomerService: () => ({
    customerService: { changeEmail: mockChangeEmail },
  }),
}))

jest.mock('@/components/ui/toast', () => ({
  ...jest.requireActual('@/components/ui/toast'),
  addToast: jest.fn(),
}))

const NS = 'account.myAccount.changeEmail'

const UPDATED_CUSTOMER = {
  id: 'c1',
  email: 'new@example.com',
  version: 2,
  isEmailVerified: false,
}

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <ChangeEmailForm />
    </QueryClientProvider>
  )
  return { user: userEvent.setup(), queryClient }
}

function input(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement
}

async function submitForm(
  user: ReturnType<typeof userEvent.setup>,
  email = 'new@example.com'
) {
  await user.type(input('newEmail'), email)
  await user.type(input('changeEmailCurrentPassword'), 'secret123')
  await user.click(
    screen.getByRole('button', { name: `${NS}.submitButtonLabel` })
  )
}

describe('ChangeEmailForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uses an email input', () => {
    renderForm()

    expect(input('newEmail')).toHaveAttribute('type', 'email')
  })

  it('shows a taken email on the field, focuses it and shows no toast', async () => {
    mockChangeEmail.mockRejectedValue(new EmailInUseError())
    const { user } = renderForm()

    await submitForm(user)

    expect(
      await screen.findByText(`${NS}.errors.emailInUse`)
    ).toBeInTheDocument()
    expect(input('newEmail')).toHaveFocus()
    expect(input('newEmail')).toHaveAttribute('aria-invalid', 'true')
    expect(addToast).not.toHaveBeenCalled()
  })

  it('shows an unchanged email on the field, focuses it and shows no success', async () => {
    mockChangeEmail.mockRejectedValue(new EmailUnchangedError())
    const { user } = renderForm()

    await submitForm(user)

    expect(
      await screen.findByText(`${NS}.errors.emailUnchanged`)
    ).toBeInTheDocument()
    expect(input('newEmail')).toHaveFocus()
    expect(addToast).not.toHaveBeenCalled()
    expect(screen.queryByText(`${NS}.verifyNotice`)).not.toBeInTheDocument()
  })

  it('shows a wrong current password on the field, focuses it and shows no toast', async () => {
    mockChangeEmail.mockRejectedValue(new InvalidCurrentPasswordError())
    const { user } = renderForm()

    await submitForm(user)

    expect(
      await screen.findByText(`${NS}.errors.wrongCurrentPassword`)
    ).toBeInTheDocument()
    expect(input('changeEmailCurrentPassword')).toHaveFocus()
    expect(addToast).not.toHaveBeenCalled()
  })

  it('shows the generic error toast and no field error for any other failure', async () => {
    mockChangeEmail.mockRejectedValue(new Error('500 Internal Server Error'))
    const { user } = renderForm()

    await submitForm(user)

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        type: 'error',
        children: `${NS}.changeEmailError`,
      })
    )
    expect(input('newEmail')).not.toHaveAttribute('aria-invalid', 'true')
    expect(input('changeEmailCurrentPassword')).not.toHaveAttribute(
      'aria-invalid',
      'true'
    )
  })

  it('updates the cached customer and asks to confirm the new address on success', async () => {
    mockChangeEmail.mockResolvedValue({
      customer: UPDATED_CUSTOMER,
      emailToken: 'token-1',
    })
    const { user, queryClient } = renderForm()

    await submitForm(user)

    expect(await screen.findByText(`${NS}.verifyNotice`)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: `${NS}.verifyEmailButton` })
    ).toHaveAttribute('href', '/sign-up/verify-email?token=token-1')
    expect(queryClient.getQueryData(customerKeys.me())).toEqual(
      UPDATED_CUSTOMER
    )
    expect(addToast).toHaveBeenCalledWith({
      type: 'success',
      children: `${NS}.changeEmailSuccess`,
    })
    expect(input('newEmail')).toHaveValue('')
  })

  it('shows no confirmation notice when the email is still verified', async () => {
    mockChangeEmail.mockResolvedValue({
      customer: { ...UPDATED_CUSTOMER, isEmailVerified: true },
    })
    const { user } = renderForm()

    await submitForm(user)

    await waitFor(() => expect(addToast).toHaveBeenCalled())
    expect(screen.queryByText(`${NS}.verifyNotice`)).not.toBeInTheDocument()
  })

  it('blocks the submit for an invalid email', async () => {
    const { user } = renderForm()

    await submitForm(user, 'not-an-email')

    expect(
      await screen.findByText(`${NS}.errors.emailInvalid`)
    ).toBeInTheDocument()
    expect(mockChangeEmail).not.toHaveBeenCalled()
  })
})
