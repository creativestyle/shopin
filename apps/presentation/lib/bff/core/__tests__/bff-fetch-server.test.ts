/**
 * @jest-environment node
 */

/**
 * createBffFetchServer builds the server-side BFF client used by all server
 * components and page loaders. Its key responsibility is choosing the right
 * fetch options based on two orthogonal flags:
 *
 * 1. Variant context (getRequestVariant): if the current request was routed through
 *    the [variant] layout, the resolved data-source headers are available. The
 *    client forwards them as explicit variantHeaders ({...}) so ISR-cached fetches
 *    carry X-Data-Source. When the context is undefined (client-side navigation
 *    that skips the layout), variantHeaders is omitted and the BFF uses its default.
 *
 * 2. Draft mode (isDraft): preview/draft renders must bypass the ISR cache
 *    entirely. When true, isDraft is forwarded regardless of the variant context.
 *
 * Tests confirm both flags are orthogonal and that the caller's own fetch
 * options are merged with extraOpts taking precedence on collision.
 */
// ─── Module mocks (must precede imports) ────────────────────────────────────
// Note: jest.mock factories are hoisted above variable declarations, so we use
// jest.fn() inline in the factory and access the mocks via jest.requireMock().

jest.mock('../bff-fetch', () => ({ bffFetch: jest.fn() }))
jest.mock('../bff-utils-server', () => ({ getBffServerUrl: jest.fn() }))
jest.mock('next-intl/server', () => ({ getLocale: jest.fn() }))
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn() } }))
jest.mock('@/lib/request-context/variant', () => ({
  getRequestVariant: jest.fn(),
}))
jest.mock('@/lib/variant/variant-key', () => ({ variantHeaders: jest.fn() }))

// ─── System under test ──────────────────────────────────────────────────────

import { createBffFetchServer } from '../bff-fetch-server'
import type { BffFetchOptions } from '../bff-fetch'

// ─── Helpers ────────────────────────────────────────────────────────────────

const BASE_URL = 'http://bff-internal'
const VARIANT_RESOLVED = { dataSource: 'commercetools-set' }
const VARIANT_HEADERS = { 'X-Data-Source': 'commercetools-set' }
const MOCK_RESPONSE = { ok: true, status: 200 } as unknown as Response

function mocks() {
  return {
    bffFetch: jest.mocked(
      jest.requireMock('../bff-fetch').bffFetch as jest.Mock
    ),
    getBffServerUrl: jest.mocked(
      jest.requireMock('../bff-utils-server').getBffServerUrl as jest.Mock
    ),
    getLocale: jest.mocked(
      jest.requireMock('next-intl/server').getLocale as jest.Mock
    ),
    loggerError: jest.mocked(
      jest.requireMock('@/lib/logger').logger.error as jest.Mock
    ),
    getRequestVariant: jest.mocked(
      jest.requireMock('@/lib/request-context/variant')
        .getRequestVariant as jest.Mock
    ),
    variantHeaders: jest.mocked(
      jest.requireMock('@/lib/variant/variant-key').variantHeaders as jest.Mock
    ),
  }
}

function lastCallOptions() {
  return (mocks().bffFetch.mock.lastCall?.[2] ?? {}) as Record<string, unknown>
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('createBffFetchServer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const m = mocks()
    m.getBffServerUrl.mockResolvedValue(BASE_URL)
    m.getLocale.mockResolvedValue('en')
    m.bffFetch.mockResolvedValue(MOCK_RESPONSE)
    m.getRequestVariant.mockReturnValue(undefined) // default: unset
    m.variantHeaders.mockReturnValue(VARIANT_HEADERS)
  })

  // ─── locale resolution ─────────────────────────────────────────────────

  describe('locale resolution', () => {
    it('uses opts.locale when provided and skips getLocale()', async () => {
      const m = mocks()
      const client = await createBffFetchServer({ locale: 'de' })
      await client.fetch('/nav')
      expect(m.getLocale).not.toHaveBeenCalled()
      expect(m.bffFetch).toHaveBeenCalledWith(
        BASE_URL,
        '/nav',
        expect.anything(),
        'de'
      )
    })

    it('falls back to getLocale() when opts.locale is absent', async () => {
      const m = mocks()
      m.getLocale.mockResolvedValue('de')
      const client = await createBffFetchServer()
      await client.fetch('/nav')
      expect(m.getLocale).toHaveBeenCalled()
      expect(m.bffFetch).toHaveBeenCalledWith(
        BASE_URL,
        '/nav',
        expect.anything(),
        'de'
      )
    })
  })

  // ─── variant context ───────────────────────────────────────────────────

  describe('variant context — defined', () => {
    beforeEach(() => {
      const m = mocks()
      m.getRequestVariant.mockReturnValue(VARIANT_RESOLVED)
      m.variantHeaders.mockReturnValue(VARIANT_HEADERS)
    })

    it('forwards the resolved variantHeaders to baseBffFetch', async () => {
      const client = await createBffFetchServer()
      await client.fetch('/nav')
      expect(lastCallOptions().variantHeaders).toEqual(VARIANT_HEADERS)
    })
  })

  describe('variant context — undefined', () => {
    it('does not set variantHeaders when variant context is undefined', async () => {
      // When undefined the BFF falls back to its own default data source.
      const client = await createBffFetchServer()
      await client.fetch('/nav')
      expect(lastCallOptions().variantHeaders).toBeUndefined()
    })
  })

  // ─── isDraft flag ──────────────────────────────────────────────────────

  describe('isDraft flag', () => {
    it('sets isDraft: true when opts.isDraft is true', async () => {
      mocks().getRequestVariant.mockReturnValue(VARIANT_RESOLVED)
      const client = await createBffFetchServer({ isDraft: true })
      await client.fetch('/nav')
      expect(lastCallOptions().isDraft).toBe(true)
    })

    it('sets variantHeaders and isDraft when variant context and isDraft are both set', async () => {
      mocks().getRequestVariant.mockReturnValue(VARIANT_RESOLVED)
      const client = await createBffFetchServer({ isDraft: true })
      await client.fetch('/nav')
      expect(lastCallOptions().variantHeaders).toEqual(VARIANT_HEADERS)
      expect(lastCallOptions().isDraft).toBe(true)
    })

    it('sets isDraft: true even when variant context is undefined', async () => {
      const client = await createBffFetchServer({ isDraft: true })
      await client.fetch('/nav')
      expect(lastCallOptions().isDraft).toBe(true)
      expect(lastCallOptions().variantHeaders).toBeUndefined()
    })

    it('does not set isDraft when opts.isDraft is false or absent', async () => {
      const client = await createBffFetchServer({ isDraft: false })
      await client.fetch('/nav')
      expect(lastCallOptions().isDraft).toBeUndefined()
    })
  })

  // ─── error handling ────────────────────────────────────────────────────

  describe('error handling', () => {
    it('logs the error and re-throws when baseBffFetch rejects', async () => {
      const m = mocks()
      const err = new Error('network failure')
      m.bffFetch.mockRejectedValue(err)
      const client = await createBffFetchServer()
      await expect(client.fetch('/nav')).rejects.toThrow('network failure')
      expect(m.loggerError).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/nav', error: 'network failure' }),
        'BFF request failed'
      )
    })

    it('converts non-Error rejections to a string in the log', async () => {
      const m = mocks()
      m.bffFetch.mockRejectedValue('timeout')
      const client = await createBffFetchServer()
      await expect(client.fetch('/nav')).rejects.toBe('timeout')
      expect(m.loggerError).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'timeout' }),
        'BFF request failed'
      )
    })
  })

  // ─── caller options forwarded ──────────────────────────────────────────

  it('merges caller options with extraOpts, extraOpts taking precedence on collision', async () => {
    mocks().getRequestVariant.mockReturnValue(VARIANT_RESOLVED)
    const client = await createBffFetchServer()
    // Pass variantHeaders from the caller — extraOpts must override it with the resolved headers.
    // A reversed spread ({ ...extraOpts, ...options }) would leave it wrong and fail.
    const callerHeaders = { 'X-Data-Source': 'wrong-source' }
    await client.fetch('/nav', {
      method: 'POST',
      variantHeaders: callerHeaders,
    } as BffFetchOptions)
    const opts = lastCallOptions()
    expect(opts.method).toBe('POST')
    expect(opts.variantHeaders).toEqual(VARIANT_HEADERS)
  })
})
