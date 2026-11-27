import { randomBytes } from 'node:crypto'
import { loadEnvFile } from '../env/env-file'
import { TokenEncryptionService } from '../token-management/token-encryption.service'
import { VaultService } from './vault.service'
import { TokenStorageService } from '../token-management/token-storage.service'

jest.mock('../../data-source/providers', () => ({
  keyOf: (id: string) => id,
  currentProviders: () => ({ providers: { commerce: 'commercetools' } }),
}))

const key = () => randomBytes(32).toString('base64')
Object.assign(process.env, {
  SHOPIN_IGNORE_ENV_FILE: '1',
  JWT_ENCRYPTION_KEY: key(),
  JWT_SIGNING_KEY: key(),
})
loadEnvFile()
const encryption = new TokenEncryptionService({
  setContext() {},
  error() {},
} as never)

/** The browser's cookie jar across requests: what one response sets, the next request sends. */
function browser(linked?: (provider: string) => Promise<string | undefined>) {
  const jar = new Map<string, string>()
  const request = () =>
    new VaultService(
      {
        getCookie: (n: string) => jar.get(n),
        setCookie: (n: string, v: string) => void jar.set(n, v),
        clearCookie: (n: string) => void jar.delete(n),
        createCookieOptions: () => ({}),
      } as never,
      encryption,
      linked
    )
  return { jar, request }
}

describe('VaultService.refreshOnce', () => {
  it('keeps the refresh token when the provider returns none (commercetools does not rotate it)', async () => {
    const { request } = browser()
    await request().set(
      'commerce',
      'commercetools',
      { accessToken: 'a1', refreshToken: 'r1', expiresIn: -1 },
      false
    )
    const refreshed = await request().refreshOnce(
      'commerce',
      'commercetools',
      async () => ({ accessToken: 'a2', expiresIn: 3600 }) as never
    )
    expect(refreshed).toMatchObject({ accessToken: 'a2', refreshToken: 'r1' })
    // the next request still has the entry (it was dropped as invalid before)
    expect(await request().entry('commerce', 'commercetools')).toMatchObject({
      accessToken: 'a2',
      refreshToken: 'r1',
      customer: false,
    })
  })

  it('stores a rotated refresh token when the provider returns one', async () => {
    const { request } = browser()
    await request().set(
      'commerce',
      'x',
      { accessToken: 'a1', refreshToken: 'r1', expiresIn: -1 },
      true
    )
    await request().refreshOnce('commerce', 'x', async () => ({
      accessToken: 'a2',
      refreshToken: 'r2',
      expiresIn: 3600,
    }))
    expect(await request().entry('commerce', 'x')).toMatchObject({
      refreshToken: 'r2',
      customer: true,
    })
  })
})

describe("a customer's commerce token lives only as long as the session that links the customer", () => {
  const customerToken = {
    accessToken: 'c1',
    refreshToken: 'cr1',
    expiresIn: 3600,
  }
  let link: string | undefined
  const linked = async (provider: string) =>
    provider === 'commercetools' ? link : undefined

  it('kept while the session links a customer at that provider', async () => {
    link = 'ct-customer-1'
    const { request } = browser(linked)
    await request().set(
      'commerce',
      'commercetools',
      customerToken,
      true,
      'ct-customer-1'
    )
    expect(await request().entry('commerce', 'commercetools')).toMatchObject({
      accessToken: 'c1',
      customer: true,
    })
  })

  it('dropped, cookie and all, once the session no longer links one (expired, revoked, refused)', async () => {
    link = 'ct-customer-1'
    const { jar, request } = browser(linked)
    await request().set(
      'commerce',
      'commercetools',
      customerToken,
      true,
      'ct-customer-1'
    )
    link = undefined
    expect(await request().entry('commerce', 'commercetools')).toBeUndefined()
    expect(
      await request().forPart('commerce', 'commercetools').get()
    ).toBeUndefined()
    expect(jar.has('vault.commerce.commercetools')).toBe(false)
  })

  it("dropped when the session links another customer (a victim's copied vault cookie next to the attacker's own sign-in)", async () => {
    link = 'ct-victim'
    const { jar, request } = browser(linked)
    await request().set(
      'commerce',
      'commercetools',
      customerToken,
      true,
      'ct-victim'
    )
    link = 'ct-attacker'
    expect(await request().entry('commerce', 'commercetools')).toBeUndefined()
    expect(jar.has('vault.commerce.commercetools')).toBe(false)
  })

  it('a customer entry that does not name its customer is never trusted', async () => {
    link = 'ct-customer-1'
    const { request } = browser(linked)
    await request().set('commerce', 'commercetools', customerToken, true)
    expect(await request().entry('commerce', 'commercetools')).toBeUndefined()
  })

  it('the refresh keeps whose entry it is', async () => {
    link = 'ct-customer-1'
    const { request } = browser(linked)
    await request().set(
      'commerce',
      'commercetools',
      { ...customerToken, expiresIn: -1 },
      true,
      'ct-customer-1'
    )
    await request().refreshOnce(
      'commerce',
      'commercetools',
      async () =>
        ({
          accessToken: 'c2',
          expiresIn: 3600,
        }) as never
    )
    expect(await request().entry('commerce', 'commercetools')).toMatchObject({
      accessToken: 'c2',
      customerId: 'ct-customer-1',
    })
  })

  it("a guest's token needs no link", async () => {
    link = undefined
    const { request } = browser(linked)
    await request().set('commerce', 'commercetools', customerToken, false)
    expect(await request().entry('commerce', 'commercetools')).toMatchObject({
      customer: false,
    })
  })
})

describe("a part's view of its entry (TokenVault)", () => {
  it("an expired entry is still the customer's: whose tokens they are does not expire with the access token", async () => {
    const { request } = browser(async () => 'ct-customer-1')
    await request().set(
      'commerce',
      'commercetools',
      { accessToken: 'c1', refreshToken: 'cr1', expiresIn: -1 },
      true,
      'ct-customer-1'
    )
    expect(
      await request().forPart('commerce', 'commercetools').get()
    ).toMatchObject({ customer: true, expiresIn: 0 })
  })
})

describe('a stale customer cookie is no token (the first cart call creates a guest session instead of failing)', () => {
  it('hasAccessToken reads the entry the vault still trusts, not just that a cookie exists', async () => {
    let link: string | undefined = 'ct-customer-1'
    const { jar, request } = browser(async () => link)
    await request().set(
      'commerce',
      'commercetools',
      { accessToken: 'c1', refreshToken: 'cr1', expiresIn: 3600 },
      true,
      'ct-customer-1'
    )
    expect(await new TokenStorageService(request()).hasAccessToken()).toBe(true)
    link = undefined // the session ended (30 days idle); the 200-day vault cookie is still there
    expect(jar.has('vault.commerce.commercetools')).toBe(true)
    expect(await new TokenStorageService(request()).hasAccessToken()).toBe(
      false
    )
  })
})

describe("a port that stores a customer's token", () => {
  it('stores it for the customer the session links, so the vault keeps trusting it', async () => {
    const { request } = browser(async () => 'ct-customer-1')
    await request()
      .forPart('commerce', 'commercetools')
      .set({ accessToken: 'c1', refreshToken: 'r1', expiresIn: 3600 }, true)
    expect(await request().entry('commerce', 'commercetools')).toMatchObject({
      accessToken: 'c1',
      customerId: 'ct-customer-1',
    })
  })
})
