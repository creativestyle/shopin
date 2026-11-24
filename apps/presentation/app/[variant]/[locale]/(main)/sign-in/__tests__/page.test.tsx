import { act, render, screen } from '@testing-library/react'
import Page from '../page'

const mockReplace = jest.fn()
let mockSearchParams = new URLSearchParams()

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn((ns: string) =>
    Promise.resolve((key: string) => `${ns}.${key}`)
  ),
}))

jest.mock('@/lib/request-context/route-context', () => ({
  initRouteContext: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}))

jest.mock('@/lib/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

jest.mock('../../auth-page-guard', () => ({
  AuthPageGuard: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@/features/auth/auth-login-form', () => ({
  LoginForm: () => <form aria-label='login' />,
}))

const NS = 'account.signIn'

async function renderPage(search: string) {
  window.history.replaceState(null, '', `/sign-in${search}`)
  mockSearchParams = new URLSearchParams(search)
  render(
    await Page({
      params: Promise.resolve({ variant: '~d', locale: 'en' }),
      searchParams: Promise.resolve(Object.fromEntries(mockSearchParams)),
    })
  )
  await act(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  )
}

describe('Sign-in page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows the email-verified message for ?verified=true', async () => {
    await renderPage('?verified=true')

    expect(screen.getByRole('status')).toHaveTextContent(`${NS}.emailVerified`)
  })

  it('shows the password-reset message for ?resetSuccess=true', async () => {
    await renderPage('?resetSuccess=true')

    expect(screen.getByRole('status')).toHaveTextContent(`${NS}.passwordReset`)
  })

  it('shows no message for ?verified=1', async () => {
    await renderPage('?verified=1')

    expect(screen.getByRole('status').textContent).toBe('')
    expect(screen.getByRole('heading', { name: `${NS}.title` })).toBeVisible()
  })

  it('links to sign-up without a query by default', async () => {
    await renderPage('')

    expect(screen.getByRole('link', { name: `${NS}.signUp` })).toHaveAttribute(
      'href',
      '/sign-up'
    )
  })

  it('keeps returnTo on the sign-up link', async () => {
    await renderPage('?returnTo=%2Fcheckout&verified=true')

    expect(screen.getByRole('link', { name: `${NS}.signUp` })).toHaveAttribute(
      'href',
      '/sign-up?returnTo=%2Fcheckout'
    )
  })
})
