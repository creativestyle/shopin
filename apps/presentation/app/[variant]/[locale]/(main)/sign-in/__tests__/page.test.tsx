import { act, render, screen } from '@testing-library/react'
import Page from '../page'

const mockReplace = jest.fn()
const mockRedirect = jest.fn(({ href }: { href: string }) => {
  throw new Error(`NEXT_REDIRECT:${href}`)
})
let mockSearchParams = new URLSearchParams()
let mockSession = 'signed-out'
let mockGuardVerified: boolean | undefined

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
  redirect: (args: { href: string }) => mockRedirect(args),
}))

jest.mock('@/features/customer/customer-server-session', () => ({
  getServerSession: async () => mockSession,
}))

jest.mock('../../auth-page-guard', () => ({
  AuthPageGuard: ({
    children,
    isVerifiedOnServer,
  }: {
    children: React.ReactNode
    isVerifiedOnServer?: boolean
  }) => {
    mockGuardVerified = isVerifiedOnServer
    return children
  },
}))

jest.mock('@/features/auth/auth-login-form', () => ({
  LoginForm: () => <form aria-label='login' />,
}))

const NS = 'account.signIn'

function renderServerPage(search: string) {
  mockSearchParams = new URLSearchParams(search)
  return Page({
    params: Promise.resolve({ variant: '~d', locale: 'en' }),
    searchParams: Promise.resolve(Object.fromEntries(mockSearchParams)),
  })
}

async function renderPage(search: string) {
  window.history.replaceState(null, '', `/sign-in${search}`)
  render(await renderServerPage(search))
  await act(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  )
}

describe('Sign-in page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSession = 'signed-out'
    mockGuardVerified = undefined
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

  it('redirects a signed-in customer to the account overview on the server', async () => {
    mockSession = 'signed-in'

    await expect(renderServerPage('')).rejects.toThrow('NEXT_REDIRECT:/account')
    expect(mockRedirect).toHaveBeenCalledWith({
      href: '/account',
      locale: 'en',
    })
  })

  it('redirects a signed-in customer to returnTo on the server', async () => {
    mockSession = 'signed-in'

    await expect(
      renderServerPage('?returnTo=%2Faccount%2Forders%3Fpage%3D3')
    ).rejects.toThrow('NEXT_REDIRECT:/account/orders?page=3')
  })

  it('ignores an unsafe returnTo in the server redirect', async () => {
    mockSession = 'signed-in'

    await expect(
      renderServerPage('?returnTo=%2F%09%2Fevil.com')
    ).rejects.toThrow('NEXT_REDIRECT:/account')
  })

  it('lets the client guard skip loading when the server saw a guest', async () => {
    await renderPage('')

    expect(mockRedirect).not.toHaveBeenCalled()
    expect(mockGuardVerified).toBe(true)
  })

  it('leaves the decision to the client guard when the session is unknown', async () => {
    mockSession = 'unknown'
    await renderPage('')

    expect(mockRedirect).not.toHaveBeenCalled()
    expect(mockGuardVerified).toBe(false)
  })
})
