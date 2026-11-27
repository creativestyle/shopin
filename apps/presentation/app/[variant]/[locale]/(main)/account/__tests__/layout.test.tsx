import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import Layout from '../layout'

const mockRedirect = jest.fn(({ href }: { href: string }) => {
  throw new Error(`NEXT_REDIRECT:${href}`)
})
let mockSession = 'signed-in'
let mockRequestPath: string | null = '/account'
let mockGuardVerified: boolean | undefined

jest.mock('@/lib/request-context/route-context', () => ({
  initRouteContext: jest.fn(),
}))

jest.mock('@/lib/request-context/request-path', () => ({
  getRequestPath: async () => mockRequestPath,
}))

jest.mock('@/lib/navigation', () => ({
  redirect: (args: { href: string }) => mockRedirect(args),
}))

jest.mock('@/features/customer/customer-server-session', () => ({
  getServerSession: async () => mockSession,
}))

jest.mock('../protected-page-guard', () => ({
  ProtectedPageGuard: ({
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

function renderLayout() {
  return Layout({
    params: Promise.resolve({ variant: '~d', locale: 'de' }),
    children: <p>account content</p>,
  })
}

describe('Account layout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSession = 'signed-in'
    mockRequestPath = '/account'
    mockGuardVerified = undefined
  })

  it('renders children for a signed-in customer', async () => {
    render(await renderLayout())

    expect(screen.getByText('account content')).toBeInTheDocument()
    expect(mockRedirect).not.toHaveBeenCalled()
    expect(mockGuardVerified).toBe(true)
  })

  it('redirects a guest to sign-in with path and query as returnTo', async () => {
    mockSession = 'signed-out'
    mockRequestPath = '/account/orders?page=3'

    await expect(renderLayout()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith({
      href: '/sign-in?returnTo=%2Faccount%2Forders%3Fpage%3D3',
      locale: 'de',
    })
  })

  it('redirects to plain sign-in when the request path is unsafe or missing', async () => {
    mockSession = 'signed-out'
    mockRequestPath = '//evil.com'
    await expect(renderLayout()).rejects.toThrow('NEXT_REDIRECT:/sign-in')

    mockRequestPath = null
    await expect(renderLayout()).rejects.toThrow('NEXT_REDIRECT:/sign-in')
    expect(mockRedirect).toHaveBeenLastCalledWith({
      href: '/sign-in',
      locale: 'de',
    })
  })

  it('leaves the decision to the client guard when the session is unknown', async () => {
    mockSession = 'unknown'
    render(await renderLayout())

    expect(screen.getByText('account content')).toBeInTheDocument()
    expect(mockRedirect).not.toHaveBeenCalled()
    expect(mockGuardVerified).toBe(false)
  })
})
