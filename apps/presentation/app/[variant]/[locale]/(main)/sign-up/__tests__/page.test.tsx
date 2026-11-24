import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import Page from '../page'

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
}))

jest.mock('../../auth-page-guard', () => ({
  AuthPageGuard: ({ children }: { children: ReactNode }) => children,
}))

jest.mock('../sign-up-form-with-redirect', () => ({
  SignUpFormWithRedirect: () => <form aria-label='register' />,
}))

const NS = 'account.signUp'

async function renderPage(
  searchParams: Record<string, string | string[] | undefined>
) {
  render(
    await Page({
      params: Promise.resolve({ variant: '~d', locale: 'en' }),
      searchParams: Promise.resolve(searchParams),
    })
  )
}

describe('Sign-up page', () => {
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
})
