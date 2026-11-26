/**
 * The credentials check at the BFF's start, as for every vendor: an unreachable auth host or a refused API client is
 * named with the host and the variable to fix (never a bare "fetch failed"); the BFF then marks commerce unavailable.
 */
import { commercePort } from '../src/parts/commerce'

const OPTIONS = {
  projectKey: 'shop-project',
  clientId: 'client',
  clientSecret: 'secret',
  apiUrl: 'https://api.europe-west1.gcp.commercetools.com',
  authUrl: 'https://auth.europe-west1.gcp.commercetools.com',
}
const probe = () => commercePort().probe!({} as never, OPTIONS as never)

describe('commercetools credentials check at start', () => {
  const real = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = real
  })

  it('an unreachable auth host: names it, COMMERCETOOLS_AUTH_URL and ENOTFOUND', async () => {
    globalThis.fetch = (async () => {
      throw new TypeError('fetch failed', {
        cause: Object.assign(new Error('getaddrinfo ENOTFOUND'), {
          code: 'ENOTFOUND',
        }),
      })
    }) as typeof fetch
    await expect(probe()).rejects.toThrow(
      /^auth\.europe-west1\.gcp\.commercetools\.com cannot be reached \(COMMERCETOOLS_AUTH_URL\): ENOTFOUND$/
    )
  })

  it("asks the project's anonymous token endpoint with the API client", async () => {
    type Init = NonNullable<Parameters<typeof fetch>[1]>
    let asked: [string, Init] | undefined
    globalThis.fetch = (async (url: string, init: Init) => {
      asked = [url, init]
      return new Response('{}', { status: 200 })
    }) as typeof fetch
    await probe()
    expect(asked![0]).toBe(
      'https://auth.europe-west1.gcp.commercetools.com/oauth/shop-project/anonymous/token'
    )
    expect(new Headers(asked![1].headers).get('authorization')).toBe(
      `Basic ${Buffer.from('client:secret').toString('base64')}`
    )
  })

  it('a refused API client names COMMERCETOOLS_CLIENT_ID and COMMERCETOOLS_CLIENT_SECRET', async () => {
    globalThis.fetch = (async () =>
      new Response('', { status: 401 })) as typeof fetch
    await expect(probe()).rejects.toThrow(
      /refused the credentials \(COMMERCETOOLS_CLIENT_ID, COMMERCETOOLS_CLIENT_SECRET\): HTTP 401/
    )
  })
})

describe('commercetools API client scopes at start, with customer linking on', () => {
  const real = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = real
  })
  const probeLinking = () =>
    commercePort().probe!(
      {} as never,
      {
        ...OPTIONS,
        linkCustomers: '1',
      } as never
    )
  const answering = (scope: string, urls: string[] = []) =>
    (async (url: string) => {
      urls.push(url)
      return new Response(JSON.stringify({ scope }), { status: 200 })
    }) as unknown as typeof fetch

  it('without linking, only the credentials check runs: shopper scopes suffice', async () => {
    const urls: string[] = []
    globalThis.fetch = answering('view_published_products:shop-project', urls)
    await probe()
    expect(urls).toEqual([
      'https://auth.europe-west1.gcp.commercetools.com/oauth/shop-project/anonymous/token',
    ])
  })

  it('with linking and every project scope granted, the BFF starts', async () => {
    globalThis.fetch = answering(
      'manage_orders:shop-project manage_customers:shop-project manage_payments:shop-project manage_shopping_lists:shop-project view_published_products:shop-project'
    )
    await expect(probeLinking()).resolves.toBeUndefined()
  })

  it('an admin client (manage_project) has every scope: the BFF starts', async () => {
    globalThis.fetch = answering('manage_project:shop-project')
    await expect(probeLinking()).resolves.toBeUndefined()
  })

  it('a refused token request is named as such, not as missing scopes', async () => {
    globalThis.fetch = (async (url: string) =>
      url.endsWith('/anonymous/token')
        ? new Response('{}', { status: 200 })
        : new Response('{"error":"invalid_client"}', {
            status: 401,
          })) as unknown as typeof fetch
    await expect(probeLinking()).rejects.toThrow(
      /scopes could not be read \(token request answered 401\)/
    )
  })

  it('with linking and shopper scopes only, the BFF stops and names the missing scopes', async () => {
    globalThis.fetch = answering(
      'view_orders:shop-project view_published_products:shop-project manage_my_orders:shop-project'
    )
    await expect(probeLinking()).rejects.toThrow(
      /lacks the scopes: manage_orders, manage_customers, manage_payments, manage_shopping_lists\./
    )
  })
})
