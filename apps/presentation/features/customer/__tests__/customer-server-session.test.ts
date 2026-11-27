/**
 * @jest-environment node
 */
jest.mock('next/headers', () => ({ cookies: jest.fn() }))
jest.mock('@/lib/bff/core/bff-fetch-server-with-cookies', () => ({
  createBffFetchWithCookies: jest.fn(),
}))
jest.mock('@/lib/logger', () => ({ logger: { warn: jest.fn() } }))

import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME } from '@config/constants'
import { createBffFetchWithCookies } from '@/lib/bff/core/bff-fetch-server-with-cookies'
import { logger } from '@/lib/logger'
import { getServerSession } from '../customer-server-session'

const fetchMock = jest.fn()

function setCookies(names: string[]) {
  const list = names.map((name) => ({ name, value: 'v' }))
  jest.mocked(cookies).mockResolvedValue({
    getAll: () => list,
  } as unknown as Awaited<ReturnType<typeof cookies>>)
}

function respond(status: number, body?: unknown) {
  fetchMock.mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  )
}

describe('getServerSession', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(createBffFetchWithCookies).mockResolvedValue({
      fetch: fetchMock,
    })
  })

  it('is signed out without any session cookie', async () => {
    setCookies([])

    await expect(getServerSession()).resolves.toBe('signed-out')
    expect(createBffFetchWithCookies).not.toHaveBeenCalled()
  })

  it('is signed out with a guest vault cookie but no SHOPin session, without calling the BFF', async () => {
    setCookies(['vault.commerce.platform'])

    await expect(getServerSession()).resolves.toBe('signed-out')
    expect(createBffFetchWithCookies).not.toHaveBeenCalled()
  })

  it('is signed in when the BFF returns a customer', async () => {
    setCookies([SESSION_COOKIE_NAME, 'vault.commerce.platform'])
    respond(200, { id: 'c1', email: 'jane@example.com' })

    await expect(getServerSession()).resolves.toBe('signed-in')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/customer/me'),
      expect.anything()
    )
  })

  it.each([401, 403])(
    'is signed out when the BFF answers %i (no customer in the session)',
    async (status) => {
      setCookies([SESSION_COOKIE_NAME])
      respond(status)

      await expect(getServerSession()).resolves.toBe('signed-out')
    }
  )

  it('is unknown and logs when the BFF call fails', async () => {
    setCookies([SESSION_COOKIE_NAME])
    respond(500)

    await expect(getServerSession()).resolves.toBe('unknown')
    expect(logger.warn).toHaveBeenCalled()
  })
})
