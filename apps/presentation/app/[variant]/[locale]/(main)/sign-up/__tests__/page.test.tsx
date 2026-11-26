import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import Page from '../page'

const mockRedirect = jest.fn(({ href }: { href: string }) => {
  throw new Error(`NEXT_REDIRECT:${href}`)
})
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

jest.mock('@/lib/navigation', () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
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
    children: ReactNode
    isVerifiedOnServer?: boolean
  }) => {
    mockGuardVerified = isVerifiedOnServer
    return children
  },
}))

jest.mock('../sign-up-form-with-redirect', () => ({
  SignUpFormWithRedirect: () => <form aria-label='register' />,
}))

const NS = 'account.signUp'

function renderServerPage(
  searchParams: Record<string, string | string[] | undefined>
) {
  return Page({
    params: Promise.resolve({ variant: '~d', locale: 'en' }),
    searchParams: Promise.resolve(searchParams),
  })
}

async function renderPage(
  searchParams: Record<string, string | string[] | undefined>
) {
  render(await renderServerPage(searchParams))
}

describe('Sign-up page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSession = 'signed-out'
    mockGuardVerified = undefined
  })

  it('links back to sign-in without returnTo', async () => {
    await renderPage({})

    expect(
      screen.getByRole('link', { name: `${NS}.backToSignIn` })
    ).toHaveAttribute('href', '/sign-in')
  })

  it('links back to checkout when returnTo points at checkout', async () => {
    await renderPage({ returnTo: '/checkout' })

    expect(
      screen.getByRole('link', { name: `${NS}.backToCheckout` })
    ).toHaveAttribute('href', '/checkout')
  })

  it('links back to sign-in and keeps a non-checkout returnTo', async () => {
    await renderPage({ returnTo: '/account/orders' })

    expect(
      screen.getByRole('link', { name: `${NS}.backToSignIn` })
    ).toHaveAttribute('href', '/sign-in?returnTo=%2Faccount%2Forders')
  })

  it('ignores an unsafe returnTo', async () => {
    await renderPage({ returnTo: '//evil.com/checkout' })

    expect(
      screen.getByRole('link', { name: `${NS}.backToSignIn` })
    ).toHaveAttribute('href', '/sign-in')
  })

  it('links back to sign-in for a page that only starts with checkout', async () => {
    await renderPage({ returnTo: '/checkout-help' })

    expect(
      screen.getByRole('link', { name: `${NS}.backToSignIn` })
    ).toHaveAttribute('href', '/sign-in?returnTo=%2Fcheckout-help')
  })

  it('links back to a checkout step', async () => {
    await renderPage({ returnTo: '/checkout/billing' })

    expect(
      screen.getByRole('link', { name: `${NS}.backToCheckout` })
    ).toHaveAttribute('href', '/checkout/billing')
  })

  it('redirects a signed-in customer to returnTo on the server', async () => {
    mockSession = 'signed-in'

    await expect(renderServerPage({ returnTo: '/checkout' })).rejects.toThrow(
      'NEXT_REDIRECT:/checkout'
    )
    expect(mockRedirect).toHaveBeenCalledWith({
      href: '/checkout',
      locale: 'en',
    })
  })

  it('redirects a signed-in customer to the account overview by default', async () => {
    mockSession = 'signed-in'

    await expect(renderServerPage({})).rejects.toThrow('NEXT_REDIRECT:/account')
  })

  it('ignores an unsafe returnTo in the server redirect', async () => {
    mockSession = 'signed-in'

    await expect(
      renderServerPage({ returnTo: '/\t/evil.com' })
    ).rejects.toThrow('NEXT_REDIRECT:/account')
  })

  it('lets the client guard skip loading when the server saw a guest', async () => {
    await renderPage({})

    expect(mockRedirect).not.toHaveBeenCalled()
    expect(mockGuardVerified).toBe(true)
  })

  it('leaves the decision to the client guard when the session is unknown', async () => {
    mockSession = 'unknown'
    await renderPage({})

    expect(mockRedirect).not.toHaveBeenCalled()
    expect(mockGuardVerified).toBe(false)
  })
})
