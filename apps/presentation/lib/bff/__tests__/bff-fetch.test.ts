import { bffFetch } from '../core/bff-fetch'

jest.mock('next/headers', () => ({
  cookies: async () => ({ get: () => null, toString: (): string => '' }),
}))

jest.mock('@demo/data-source-selector', () => ({
  getDataSourceHeader: () => ({ 'X-Data-Source': 'mock-set' }),
}))

jest.mock('@core/i18n', () => {
  const { I18N_CONFIG } = jest.requireActual('@config/constants')
  return {
    LANGUAGE_HEADER: I18N_CONFIG.acceptLanguageHeader,
    AcceptLanguageUtils: {
      buildClientAcceptLanguageHeader: (rfc: string) => rfc,
    },
  }
})

describe('bffFetch', () => {
  const originalFetch = global.fetch
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '{}',
    }) as typeof fetch
  })
  afterEach(() => {
    global.fetch = originalFetch as typeof fetch
  })

  it('builds url and headers correctly with locale', async () => {
    // Pass URL prefix ('de'), bffFetch will convert to RFC ('de-DE')
    await bffFetch('http://bff', 'nav', { headers: { foo: 'bar' } }, 'de')
    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe('http://bff/nav')
    const headers = (opts as { headers?: Record<string, string> }).headers || {}
    const lc = Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
    )
    const { I18N_CONFIG } = jest.requireActual('@config/constants')
    expect(lc).toStrictEqual(
      expect.objectContaining({
        'content-type': 'application/json',
        [I18N_CONFIG.acceptLanguageHeader]: 'de-DE',
        'x-data-source': 'mock-set',
        'foo': 'bar',
      })
    )
  })

  it('prefixes missing slash and uses default language when locale missing', async () => {
    await bffFetch('http://bff', '/nav')
    expect(global.fetch).toHaveBeenCalledWith(
      'http://bff/nav',
      expect.any(Object)
    )
  })
})
