/**
 * @jest-environment node
 */
import { bffFetch } from '../core/bff-fetch'
import { AcceptLanguageUtils } from '@core/i18n'
import { I18N_CONFIG, DRAFT_MODE_HEADER } from '@config/constants'
import { ALT_RESOLVED, DIMS } from '@/lib/variant/__fixtures__/variants'

jest.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => undefined,
    toString: (): string => '',
  }),
}))

// No variant-key mock needed — bffFetch no longer imports from variant-key.

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

    it('does not modify the URL when locale is provided', async () => {
      await bffFetch('http://bff', '/content/footer', {}, 'de')
      expect(lastCallUrl()).toBe('http://bff/content/footer')
    })

    it('does not modify the URL when next.revalidate is set', async () => {
      await bffFetch(
        'http://bff',
        '/content/footer',
        { next: { revalidate: 3600 } } as RequestInit,
        'de'
      )
      expect(lastCallUrl()).toBe('http://bff/content/footer')
    })

    it('preserves existing query params', async () => {
      await bffFetch(
        'http://bff',
        '/content/page?slug=foo',
        { next: { revalidate: 3600 } } as RequestInit,
        'en'
      )
      expect(lastCallUrl()).toBe('http://bff/content/page?slug=foo')
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
    it('adds draft mode header when draftToken is set', async () => {
      await bffFetch('http://bff', 'nav', { draftToken: 'signed-draft-token' })
      expect(lastCallHeaders()[DRAFT_MODE_HEADER]).toBe('signed-draft-token')
    })

    it('omits draft mode header when draftToken is absent', async () => {
      await bffFetch('http://bff', 'nav')
      expect(lastCallHeaders()[DRAFT_MODE_HEADER]).toBeUndefined()
    })
  })

  describe('variantHeaders option', () => {
    it('sends explicit variantHeaders as-is', async () => {
      // When the [variant] layout (server) or usePathname (client) provides
      // explicit headers, they are forwarded verbatim to the BFF.
      const header = DIMS[0]!.header
      await bffFetch('http://bff', 'nav', {
        variantHeaders: { [header]: ALT_RESOLVED[DIMS[0]!.name]! },
      })
      expect(lastCallHeaders()[header.toLowerCase()]).toBe(
        ALT_RESOLVED[DIMS[0]!.name]
      )
    })

    it('omits the provider headers when variantHeaders is not provided', async () => {
      // No explicit header → BFF uses each category's default provider.
      // The provider cookies are not read here; variant is URL-based.
      await bffFetch('http://bff', 'nav')
      for (const d of DIMS) {
        expect(lastCallHeaders()[d.header.toLowerCase()]).toBeUndefined()
      }
    })
  })
})
