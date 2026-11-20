import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForgotPasswordFormWithRedirect } from '../forgot-password-form-with-redirect'

const mockPush = jest.fn()

jest.mock('@/lib/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/features/auth/auth-forgot-password-form', () => ({
  ForgotPasswordForm: ({
    onSuccess,
  }: {
    onSuccess?: (token?: string) => void
  }) => <button onClick={() => onSuccess?.('tok')}>send</button>,
}))

describe('ForgotPasswordFormWithRedirect', () => {
  it('redirects to the success page with the reset token', async () => {
    render(<ForgotPasswordFormWithRedirect />)

    await userEvent.click(screen.getByRole('button', { name: 'send' }))

    expect(mockPush).toHaveBeenCalledWith('/forgot-password/success?token=tok')
  })
})
