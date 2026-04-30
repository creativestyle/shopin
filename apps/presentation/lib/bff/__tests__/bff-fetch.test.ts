/**
 * @jest-environment node
 */
import { bffFetch } from '../core/bff-fetch'
import { AcceptLanguageUtils } from '@core/i18n'
import { I18N_CONFIG } from '@config/constants'
import {
  isDraftCookieValid,
  getDraftModeHeaderValue,
  DRAFT_COOKIE_NAME,
  DRAFT_MODE_HEADER,
} from '@/lib/draft-mode'

let cookieStore: Record<string, string> = {}

jest.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieStore[name] !== undefined
        ? { value: cookieStore[name] }
        : undefined,
    toString: (): string => '',
  }),
}))

jest.mock('@demo/data-source-selector', () => ({
  getDataSourceHeader: () => ({}),
}))

jest.mock('@/lib/draft-mode', () => ({
  isDraftCookieValid: jest.fn(() => false),
  getDraftModeHeaderValue: jest.fn(() => 'signed-draft-token'),
  DRAFT_COOKIE_NAME: '__draft',
  DRAFT_MODE_HEADER: 'x-next-draft-mode',
}))

function mockFetch() {
  return global.fetch as jest.MockedFunction<typeof fetch>
}

function lastCallUrl(): string {
  return mockFetch().mock.lastCall?.[0] as string
}

function lastCallHeaders(): Record<string, string> {
  const raw = (mockFetch().mock.lastCall?.[1]?.headers ?? {}) as Record<
    string,
    string
  >
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v])
  )
}

function lastCallOpts(): RequestInit {
  return mockFetch().mock.lastCall?.[1] ?? {}
}

describe('bffFetch', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '{}',
    }) as unknown as typeof fetch
    cookieStore = {}
    jest.mocked(isDraftCookieValid).mockReturnValue(false)
  })

  afterEach(() => {
    global.fetch = originalFetch
    delete process.env.NEXT_PUBLIC_BFF_EXTERNAL_URL
  })

  describe('URL construction', () => {
    it('strips trailing slash from base', async () => {
      await bffFetch('http://bff/', 'nav')
      expect(lastCallUrl()).toBe('http://bff/nav')
    })

    it('adds leading slash to path when missing', async () => {
      await bffFetch('http://bff', 'nav/items')
      expect(lastCallUrl()).toBe('http://bff/nav/items')
    })

    it('does not double-slash when path already has leading slash', async () => {
      await bffFetch('http://bff', '/nav')
      expect(lastCallUrl()).toBe('http://bff/nav')
    })
  })

  describe('Accept-Language header', () => {
    it('converts URL prefix to RFC tag', async () => {
      await bffFetch('http://bff', 'nav', {}, 'de')
      expect(lastCallHeaders()['accept-language']).toBe(
        AcceptLanguageUtils.buildClientAcceptLanguageHeader('de-DE')
      )
    })

    it('falls back to default locale when none provided', async () => {
      await bffFetch('http://bff', 'nav')
      expect(lastCallHeaders()['accept-language']).toBe(
        AcceptLanguageUtils.buildClientAcceptLanguageHeader(
          I18N_CONFIG.defaultLocale
        )
      )
    })
  })

  describe('header merge', () => {
    it('caller headers take precedence over defaults', async () => {
      await bffFetch('http://bff', 'nav', {
        headers: { 'Content-Type': 'text/plain' },
      })
      expect(lastCallHeaders()['content-type']).toBe('text/plain')
    })
  })

  describe('credentials', () => {
    it('includes credentials when base URL matches NEXT_PUBLIC_BFF_EXTERNAL_URL origin', async () => {
      process.env.NEXT_PUBLIC_BFF_EXTERNAL_URL = 'http://bff:4000/bff'
      await bffFetch('http://bff:4000', 'nav')
      expect(lastCallOpts().credentials).toBe('include')
    })

    it('omits credentials when URL origin does not match', async () => {
      process.env.NEXT_PUBLIC_BFF_EXTERNAL_URL = 'http://bff:4000/bff'
      await bffFetch('http://other:9000', 'nav')
      expect(lastCallOpts().credentials).toBeUndefined()
    })
  })

  describe('draft mode', () => {
    it('adds draft mode header when cookie is valid', async () => {
      cookieStore[DRAFT_COOKIE_NAME] = 'cookie-value'
      jest.mocked(isDraftCookieValid).mockReturnValue(true)
      jest.mocked(getDraftModeHeaderValue).mockReturnValue('signed-draft-token')
      await bffFetch('http://bff', 'nav')
      expect(lastCallHeaders()[DRAFT_MODE_HEADER]).toBe('signed-draft-token')
    })

    it('omits draft mode header when cookie is absent', async () => {
      await bffFetch('http://bff', 'nav')
      expect(lastCallHeaders()[DRAFT_MODE_HEADER]).toBeUndefined()
    })
  })
})
