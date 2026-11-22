import { act, render, screen } from '@testing-library/react'
import { SignInConfirmation } from '../auth-sign-in-confirmation'

const mockReplace = jest.fn()
let mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}))

const NS = 'account.signIn'

function renderAt(search: string) {
  window.history.replaceState(null, '', `/sign-in${search}`)
  mockSearchParams = new URLSearchParams(search)
  render(<SignInConfirmation />)
}

const nextFrame = () =>
  act(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  )

describe('SignInConfirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fills an already-mounted empty status region after email verification', async () => {
    renderAt('?verified=true')
    const status = screen.getByRole('status')
    expect(status.textContent).toBe('')

    await nextFrame()

    expect(screen.getByRole('status')).toBe(status)
    expect(status).toHaveTextContent(`${NS}.emailVerified`)
  })

  it('shows the password-reset message after a reset', async () => {
    renderAt('?resetSuccess=true')

    await nextFrame()

    expect(screen.getByRole('status')).toHaveTextContent(`${NS}.passwordReset`)
  })

  it('strips the flag from the URL and keeps the checkout param', async () => {
    renderAt('?verified=true&isCheckout=true')

    await nextFrame()

    expect(mockReplace).toHaveBeenCalledWith('/sign-in?isCheckout=true', {
      scroll: false,
    })
  })

  it('shows nothing and leaves the URL alone for a non-true flag', async () => {
    renderAt('?verified=1')

    await nextFrame()

    expect(screen.getByRole('status').textContent).toBe('')
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
