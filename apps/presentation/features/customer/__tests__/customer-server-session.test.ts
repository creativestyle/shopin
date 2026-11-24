/**
 * @jest-environment node
 */
jest.mock('next/headers', () => ({ cookies: jest.fn() }))
jest.mock('@/lib/bff/core/bff-fetch-server-with-cookies', () => ({
  createBffFetchWithCookies: jest.fn(),
}))
jest.mock('@/lib/logger', () => ({ logger: { warn: jest.fn() } }))

import { cookies } from 'next/headers'
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

  it('is signed out without any token cookie', async () => {
    setCookies([])

    await expect(getServerSession()).resolves.toBe('signed-out')
    expect(createBffFetchWithCookies).not.toHaveBeenCalled()
  })

  it('is unknown with only a refresh token, without calling the BFF', async () => {
    setCookies(['refresh_token'])

    await expect(getServerSession()).resolves.toBe('unknown')
    expect(createBffFetchWithCookies).not.toHaveBeenCalled()
  })

  it('is signed in when the BFF returns a customer', async () => {
    setCookies(['access_token', 'refresh_token'])
    respond(200, { id: 'c1', email: 'jane@example.com' })

    await expect(getServerSession()).resolves.toBe('signed-in')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/customer/me'),
      expect.anything()
    )
  })

  it.each([401, 403])(
    'is signed out when the BFF answers %i (guest token)',
    async (status) => {
      setCookies(['access_token'])
      respond(status)

      await expect(getServerSession()).resolves.toBe('signed-out')
    }
  )

  it('is unknown and logs when the BFF call fails', async () => {
    setCookies(['access_token'])
    respond(500)

    await expect(getServerSession()).resolves.toBe('unknown')
    expect(logger.warn).toHaveBeenCalled()
  })
})
