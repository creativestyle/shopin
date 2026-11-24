/**
 * @jest-environment node
 */

// jest.mock factories are hoisted above variable declarations, so we use
// jest.fn() inline in the factory and access the mocks via jest.requireMock().

jest.mock('../bff-fetch', () => ({ bffFetch: jest.fn() }))
jest.mock('../bff-utils-server', () => ({ getBffServerUrl: jest.fn() }))
jest.mock('next-intl/server', () => ({ getLocale: jest.fn() }))
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn() } }))
jest.mock('@/lib/request-context/variant', () => ({
  getRequestVariant: jest.fn(),
}))
jest.mock('@/lib/variant/variant-key', () => ({ variantHeaders: jest.fn() }))
jest.mock('@/lib/draft-mode', () => ({
  getDraftModeHeaderValue: jest.fn(() => 'signed-draft-token'),
}))

import { createBffFetchServer } from '../bff-fetch-server'
import type { BffFetchOptions } from '../bff-fetch'
import { BffUnreachableError } from '../../utils/bff-unreachable-error'

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
      const client = await createBffFetchServer()
      await client.fetch('/nav')
      expect(lastCallOptions().variantHeaders).toBeUndefined()
    })
  })

  // ─── isDraft flag ──────────────────────────────────────────────────────

  describe('isDraft flag', () => {
    it('signs a draft token when opts.isDraft is true', async () => {
      mocks().getRequestVariant.mockReturnValue(VARIANT_RESOLVED)
      const client = await createBffFetchServer({ isDraft: true })
      await client.fetch('/nav')
      expect(lastCallOptions().draftToken).toBe('signed-draft-token')
    })

    it('sets variantHeaders and draftToken when variant context and isDraft are both set', async () => {
      mocks().getRequestVariant.mockReturnValue(VARIANT_RESOLVED)
      const client = await createBffFetchServer({ isDraft: true })
      await client.fetch('/nav')
      expect(lastCallOptions().variantHeaders).toEqual(VARIANT_HEADERS)
      expect(lastCallOptions().draftToken).toBe('signed-draft-token')
    })

    it('signs a draft token even when variant context is undefined', async () => {
      const client = await createBffFetchServer({ isDraft: true })
      await client.fetch('/nav')
      expect(lastCallOptions().draftToken).toBe('signed-draft-token')
      expect(lastCallOptions().variantHeaders).toBeUndefined()
    })

    it('does not set draftToken when opts.isDraft is false or absent', async () => {
      const client = await createBffFetchServer({ isDraft: false })
      await client.fetch('/nav')
      expect(lastCallOptions().draftToken).toBeUndefined()
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

    it('throws BffUnreachableError with the cause kept when the BFF refuses the connection', async () => {
      const m = mocks()
      const err = new TypeError('fetch failed', {
        cause: { code: 'ECONNREFUSED' },
      })
      m.bffFetch.mockRejectedValue(err)
      const client = await createBffFetchServer()

      const thrown = await client.fetch('/nav').catch((e: unknown) => e)

      expect(thrown).toBeInstanceOf(BffUnreachableError)
      expect((thrown as BffUnreachableError).cause).toBe(err)
      expect((thrown as BffUnreachableError).bffUrl).toBe(BASE_URL)
      expect((thrown as BffUnreachableError).code).toBe('ECONNREFUSED')
      expect(m.loggerError).toHaveBeenCalledWith(
        {
          path: '/nav',
          bffUrl: BASE_URL,
          code: 'ECONNREFUSED',
          error: 'fetch failed',
        },
        'BFF unreachable'
      )
    })

    it('rethrows the original error for a mid-request reset', async () => {
      const m = mocks()
      const err = new TypeError('fetch failed', {
        cause: { code: 'ECONNRESET' },
      })
      m.bffFetch.mockRejectedValue(err)
      const client = await createBffFetchServer()

      await expect(client.fetch('/nav')).rejects.toBe(err)
      expect(m.loggerError).toHaveBeenCalledWith(
        {
          path: '/nav',
          bffUrl: BASE_URL,
          code: 'ECONNRESET',
          error: 'fetch failed',
        },
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
