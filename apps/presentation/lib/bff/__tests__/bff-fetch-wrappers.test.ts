import { useBffFetchClient } from '../core/bff-fetch-client'
import { createBffFetchServer } from '../core/bff-fetch-server'
import * as BffFetchModule from '../core/bff-fetch'
import { logger } from '../../logger'

jest.mock('../core/bff-fetch', () => ({
  bffFetch: jest.fn(() => Promise.resolve({ ok: true })),
}))

jest.mock('../../logger', () => ({
  logger: { error: jest.fn() },
}))

jest.mock('next-intl', () => ({
  useLocale: () => 'en-US',
}))

jest.mock('../core/bff-utils-client', () => ({
  getBffClientUrl: () => 'https://client-bff',
}))

jest.mock('next-intl/server', () => ({
  getLocale: () => Promise.resolve('de-DE'),
}))

jest.mock('../core/bff-utils-server', () => ({
  getBffServerUrl: () => Promise.resolve('http://server-bff'),
}))

describe('bff fetch wrappers', () => {
  it('client wrapper calls bffFetch with client url, locale, and correlation ID', async () => {
    const client = useBffFetchClient()
    await client.fetch('nav/path', { method: 'GET' })
    expect(BffFetchModule.bffFetch).toHaveBeenCalledWith(
      'https://client-bff',
      'nav/path',
      expect.objectContaining({ method: 'GET' }),
      'en-US',
      expect.any(String)
    )
  })

  it('server wrapper calls bffFetch with server url, server locale, and correlation ID', async () => {
    const server = await createBffFetchServer()
    await server.fetch('nav/path', { method: 'POST' })
    expect(BffFetchModule.bffFetch).toHaveBeenCalledWith(
      'http://server-bff',
      'nav/path',
      expect.objectContaining({ method: 'POST' }),
      'de-DE',
      expect.any(String)
    )
  })

  it('server wrapper logs and rethrows when bffFetch throws (network error)', async () => {
    const networkError = new Error('Connection refused')
    ;(BffFetchModule.bffFetch as jest.Mock).mockRejectedValueOnce(networkError)

    const server = await createBffFetchServer()
    await expect(server.fetch('navigation/getNavigation')).rejects.toThrow(
      'Connection refused'
    )

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith(
      {
        path: 'navigation/getNavigation',
        correlationId: expect.any(String),
        error: 'Connection refused',
      },
      'BFF request failed'
    )
  })
})
