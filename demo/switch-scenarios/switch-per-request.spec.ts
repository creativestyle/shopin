/**
 * Switching commerce per request with the demo switch (`@demo/provider-switch`), through the real AppModule.
 * Two fixture platforms: `remote` (needs a guest session, has its own sign-in `remote-auth`) and `local`
 * (no guest session; its sign-in is `local-idp`). What is under test is the BFF with the switch: header →
 * provider selection → services, cookie names, token audience, refresh, capabilities.
 */
import {
  CORE_ENV,
  exactEnv,
  boot,
  request,
  useConfig,
  bff,
  idIn,
  type Jar,
} from '@test/category-split/harness'
import { defineConfig } from '@core/integration-kit'
import { providerSwitch } from '@demo/provider-switch'
import { fakeIdp, inMemoryCommerce } from '@test/category-split/fixtures'

const remote = inMemoryCommerce({
  id: 'remote',
  guestSession: true,
  customers: true,
})
const local = inMemoryCommerce({ id: 'local', also: ['cms'], customers: true })
const remoteAuth = fakeIdp({
  id: 'remote-auth',
  requires: {
    auth: {
      needs: { commerce: 'remote' },
      reason: 'remote sign-in uses the remote customers',
    },
  },
})
const localIdp = fakeIdp({
  id: 'local-idp',
  requires: {
    auth: {
      needs: { commerce: 'local' },
      reason: 'Local sign-in signs in local customers only',
    },
  },
})

/** One browser: a cookie jar shared by every request. */
const jar: Jar = {}
let app: Awaited<ReturnType<typeof boot>>

beforeAll(async () => {
  useConfig(() => {
    const switched = providerSwitch({
      commerce: [remote, local],
      auth: [remoteAuth, localIdp],
    })
    return defineConfig({ commerce: switched, cms: local, auth: switched })
  })
  exactEnv({ ...CORE_ENV })
  app = await boot()
})
afterAll(() => app?.close())

const header = (provider: string) => ({ 'x-commerce-provider': provider })
const current = (r: Awaited<ReturnType<typeof request>>) =>
  r.serve(() => bff('data-source/providers').currentProviders())

describe('commerce = remote and commerce = local, one browser', () => {
  it('each request is served by the provider its header names', async () => {
    const { ProductService } = bff('features/product/product.service')
    const a = await request(app, jar, header('remote'))
    const b = await request(app, jar, header('local'))
    const fromRemote = await (
      await a.get(ProductService)
    ).getProductPage('shoe')
    const fromLocal = await (await b.get(ProductService)).getProductPage('shoe')
    expect(current(a).providers.commerce).toBe('remote')
    expect(current(b).providers.commerce).toBe('local')
    expect(fromRemote.product.name).toBe('remote:shoe')
    expect(fromLocal.product.name).toBe('local:shoe')
    // no header: the first listed provider
    const none = await request(app, jar)
    expect(current(none).providers.commerce).toBe('remote')
  })

  it('carts and sessions get cookie names per provider', async () => {
    const { CartService } = bff('features/cart/cart.service')
    const { TokenStorageService } = bff(
      'common/token-management/token-storage.service'
    )
    const a = await request(app, jar, header('remote'))
    const remoteCart = await (await a.get(CartService)).createCart()
    const b = await request(app, jar, header('local'))
    const localCart = await (await b.get(CartService)).createCart()
    expect(Object.keys(jar).sort()).toEqual([
      'cart-guest.local-USD',
      'cart-guest.remote-USD',
      'vault.commerce.remote',
    ])
    expect(await idIn(jar, 'cart-guest.remote-USD')).toBe(remoteCart.id)
    expect(await idIn(jar, 'cart-guest.local-USD')).toBe(localCart.id)
    expect(remote.state.carts.map((c) => c.id)).toEqual([remoteCart.id])
    expect(local.state.carts.map((c) => c.id)).toEqual([localCart.id])
    // the local platform needs no guest session: no vault entry was created for it
    expect('vault.commerce.local' in jar).toBe(false)
    // and the remote session is still readable on a remote request
    const again = await request(app, jar, header('remote'))
    expect(await (await again.get(TokenStorageService)).getAccessToken()).toBe(
      'remote-anon-token-1'
    )
  })

  it('a remote token sent on a local request is rejected', async () => {
    const { TokenStorageService } = bff(
      'common/token-management/token-storage.service'
    )
    const { TokenEncryptionService } = bff(
      'common/token-management/token-encryption.service'
    )
    jar['vault.commerce.local'] = jar['vault.commerce.remote']!
    const b = await request(app, jar, header('local'))
    const tokens = await b.get(TokenStorageService)
    expect(await tokens.getAccessToken()).toBeUndefined()
    expect(await tokens.getRefreshToken()).toBeUndefined()
    // the rejected copy was cleared; the remote entry is untouched
    expect('vault.commerce.local' in jar).toBe(false)
    expect('vault.commerce.remote' in jar).toBe(true)
    // at the encryption layer: the audience is the port
    const enc = app.get(TokenEncryptionService, { strict: false })
    const issued = await enc.encryptAndSign('t', 60_000, 'commerce.remote')
    await expect(
      enc.decryptAndVerify(issued, 'commerce.local')
    ).rejects.toThrow('Invalid or tampered token')
    await expect(enc.decryptAndVerify(issued, 'commerce.remote')).resolves.toBe(
      't'
    )
  })

  it('a refresh never crosses providers: the remote entry is renewed by remote only, a local request has nothing to refresh', async () => {
    const { TokenRefreshInterceptor } = bff(
      'common/token-management/token-refresh.interceptor'
    )
    const { Ports } = bff('data-source/ports.module')
    const { TokenStorageService } = bff(
      'common/token-management/token-storage.service'
    )
    const { CartIdService } = bff('features/cart-id/cart-id.service')
    const { TokenProvider } = bff('common/token-management/token-provider')
    const { VaultService } = bff('common/vault/vault.service')
    const { AuthLoggerService } = bff('common/auth-logging/index')
    const interceptor = async (r: Awaited<ReturnType<typeof request>>) =>
      new TokenRefreshInterceptor(
        app.get(Ports, { strict: false }),
        await r.get(TokenStorageService),
        await r.get(CartIdService),
        await r.get(TokenProvider),
        app.get(AuthLoggerService, { strict: false }),
        await r.get(VaultService)
      ) as unknown as {
        refreshCommerceSession(): Promise<{ accessToken: string }>
      }
    remote.state.calls.length = 0
    local.state.calls.length = 0
    // on a local request: the local platform has no guest session, so nothing is refreshed (401), and the
    // remote entry is not used as a fallback
    const b = await request(app, jar, header('local'))
    const onLocal = await b.serve(async () =>
      (await interceptor(b)).refreshCommerceSession().catch((e) => e)
    )
    expect((onLocal as { status?: number }).status).toBe(401)
    expect(remote.state.calls).toEqual([])
    // on a remote request: the remote platform renews its own entry with its own refresh token
    const a = await request(app, jar, header('remote'))
    const onRemote = await a.serve(async () =>
      (await interceptor(a)).refreshCommerceSession()
    )
    expect(onRemote.accessToken).toBe('remote-refreshed-token')
    expect(remote.state.calls).toEqual(['refresh remote-refresh-token-1'])
    expect(local.state.calls).toEqual([])
    expect('vault.commerce.local' in jar).toBe(false)
  })

  it('capabilities: over local, sign-in falls to the identity provider that pairs with local', async () => {
    const { CapabilitiesController } = bff(
      'features/capabilities/capabilities.controller'
    )
    const a = await request(app, jar, header('remote'))
    const b = await request(app, jar, header('local'))
    const capsA = (await a.get(CapabilitiesController)).getCapabilities()
    const capsB = (await b.get(CapabilitiesController)).getCapabilities()
    expect(capsA.providers.auth).toBe('remote-auth')
    expect(capsB.providers.auth).toBe('local-idp')
    expect(capsB.unavailable.auth).toBeUndefined()
    // and the auth port follows: a local sign-in goes to local-idp
    remoteAuth.state.calls.length = 0
    localIdp.state.calls.length = 0
    const { AuthService } = bff('features/auth/auth.service')
    const c = await request(app, jar, header('local'))
    await (
      await c.get(AuthService)
    ).login({ email: 'alice@example.com', password: 'idp-password' })
    expect(localIdp.state.calls).toEqual(['signIn alice@example.com'])
    expect(remoteAuth.state.calls).toEqual([])
    expect(local.state.customerCalls[0]).toBe(
      'findByExternalId local-idp:idp|alice'
    )
    expect(remote.state.customerCalls).toEqual([])
  })
})
