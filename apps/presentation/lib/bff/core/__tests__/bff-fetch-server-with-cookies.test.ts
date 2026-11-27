/**
 * @jest-environment node
 */
jest.mock('../bff-fetch-server', () => ({ createBffFetchServer: jest.fn() }))
jest.mock('@/lib/logger/logger-context', () => ({
  getCorrelationId: jest.fn().mockResolvedValue('corr-1'),
}))

import {
  CART_ID_COOKIE_PREFIX_GUEST,
  CORRELATION_ID_HEADER,
  SESSION_COOKIE_NAME,
  WISHLIST_ID_COOKIE_PREFIX_LOGGED,
} from '@config/constants'
import { createBffFetchServer } from '../bff-fetch-server'
import { createBffFetchWithCookies } from '../bff-fetch-server-with-cookies'

describe('createBffFetchWithCookies', () => {
  it("forwards only the BFF's own cookies (session, vault, cart and wishlist ids) and the correlation id", async () => {
    const baseFetch = jest.fn().mockResolvedValue(new Response(null))
    jest.mocked(createBffFetchServer).mockResolvedValue({ fetch: baseFetch })

    const client = await createBffFetchWithCookies([
      { name: SESSION_COOKIE_NAME, value: 's' },
      { name: 'vault.commerce.platform', value: 'v' },
      { name: `${CART_ID_COOKIE_PREFIX_GUEST}.platform`, value: 'c' },
      { name: `${WISHLIST_ID_COOKIE_PREFIX_LOGGED}.platform`, value: 'w' },
      { name: 'analytics', value: 'x' },
      { name: 'NEXT_LOCALE', value: 'en' },
    ])
    await client.fetch('/customer/me')

    const headers = new Headers(baseFetch.mock.calls[0][1].headers)
    expect(headers.get('Cookie')).toBe(
      `${SESSION_COOKIE_NAME}=s; vault.commerce.platform=v; ${CART_ID_COOKIE_PREFIX_GUEST}.platform=c; ${WISHLIST_ID_COOKIE_PREFIX_LOGGED}.platform=w`
    )
    expect(headers.get(CORRELATION_ID_HEADER)).toBe('corr-1')
  })
})
