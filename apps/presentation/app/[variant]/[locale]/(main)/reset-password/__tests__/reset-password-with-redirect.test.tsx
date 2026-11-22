import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResetPasswordWithRedirect } from '../reset-password-with-redirect'

const mockReplace = jest.fn()

jest.mock('@/lib/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

jest.mock('@/features/auth/auth-reset-password-form', () => ({
  ResetPasswordForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button onClick={() => onSuccess?.()}>reset</button>
  ),
}))

describe('ResetPasswordWithRedirect', () => {
  it('redirects to sign-in with the password-reset flag on success', async () => {
    render(<ResetPasswordWithRedirect />)

    await userEvent.click(screen.getByRole('button', { name: 'reset' }))

    expect(mockReplace).toHaveBeenCalledWith('/sign-in?resetSuccess=true')
  })
})
