/**
 * The demo switch in the real BFF (the framework's scenario harness, @test/category-split): a delegate that cannot
 * serve at boot is passed over per request, each request's commerce provider decides the optional services, the
 * switch serves through every listed port, and its defaults must serve together. Each case boots its own BFF in an
 * isolated module registry.
 */
import {
  CORE_ENV,
  exactEnv,
  boot,
  bff,
  inspect,
  loaded,
  request,
  useConfig,
} from '@test/category-split/harness'

type Fixtures = typeof import('@test/category-split/fixtures')
type Kit = typeof import('@core/integration-kit')

/** An integration whose port's credentials check fails (as a wrong token would). */
const failing = (kit: Kit, id: string, category: 'cms' | 'commerce') =>
  kit.defineIntegration({
    id,
    ports: {
      [category]: () =>
        kit.port(category, {
          useFactory: () => ({}) as never,
          probe: async () => {
            throw new Error('401 Unauthorized')
          },
        }),
    } as never,
  })

const REMOTE_ENV = {
  REMOTE_PROJECT_KEY: 'p',
  REMOTE_CLIENT_SECRET: 'secret',
  REMOTE_API_URL: 'https://api.invalid',
}
const REMOTE_SEARCH_ENV = { REMOTE_SEARCH_KEY: 'k' }

/** The fixtures of one boot, in the current module registry. */
function fixtures(fx: Fixtures) {
  const remote = fx.inMemoryCommerce({
    id: 'remote',
    also: ['search'],
    guestSession: true,
    env: {
      commerce: {
        projectKey: { env: 'REMOTE_PROJECT_KEY' },
        clientSecret: { env: 'REMOTE_CLIENT_SECRET' },
        apiUrl: { env: 'REMOTE_API_URL' },
        storeKeys: { env: 'REMOTE_STORE_KEYS', optional: true },
      },
      search: { searchKey: { env: 'REMOTE_SEARCH_KEY' } },
    },
    // a port (or its SDK) reading a variable from process.env itself finds nothing
    snoop: ['REMOTE_CLIENT_SECRET', 'FINDER_API_KEY', 'JWT_SIGNING_KEY'],
    requires: {
      search: {
        needs: { commerce: 'remote' },
        reason: 'remote search reads the remote catalog',
      },
    },
  })
  const local = fx.inMemoryCommerce({ id: 'local', also: ['search', 'cms'] })
  const finder = fx.contentOnly({
    id: 'finder',
    serves: ['search'],
    env: {
      search: {
        appId: { env: 'FINDER_APP_ID' },
        apiKey: { env: 'FINDER_API_KEY' },
        index: { env: 'FINDER_INDEX' },
      },
    },
  })
  const headless = fx.contentOnly({
    id: 'headless',
    serves: ['cms'],
    env: {
      cms: {
        space: { env: 'HEADLESS_SPACE' },
        accessToken: { env: 'HEADLESS_ACCESS_TOKEN' },
      },
    },
  })
  return { remote, local, finder, headless }
}

describe('the demo switch in the BFF', () => {
  it('with the demo switch and no vendor variable: starts; providers that cannot serve are unavailable with the reason; requests fall back', async () => {
    await jest.isolateModulesAsync(async () => {
      const fx: Fixtures = require('@test/category-split/fixtures')
      const kit: Kit = require('@core/integration-kit')
      const local = fx.inMemoryCommerce({ id: 'local', also: ['cms'] })
      const vendor = fx.inMemoryCommerce({
        id: 'vendor',
        env: { commerce: { key: { env: 'VENDOR_KEY' } } },
      })
      useConfig(() => {
        const switched = require('@demo/provider-switch').providerSwitch({
          commerce: [vendor, local],
          cms: [failing(kit, 'broken-cms', 'cms'), local],
        })
        return kit.defineConfig({ commerce: switched, cms: switched })
      })
      exactEnv({ ...CORE_ENV })
      const app = await boot()
      try {
        const r = await request(app, {}, { 'x-commerce-provider': 'vendor' })
        const { CapabilitiesController } = bff(
          'features/capabilities/capabilities.controller'
        )
        const caps = r.serve(async () =>
          (await r.get(CapabilitiesController)).getCapabilities()
        )
        const got = await caps
        expect(got.providers).toMatchObject({
          commerce: 'local',
          cms: 'local',
        })
        // public: fixed codes only (the missing variable and the 401 are in the start-up log)
        expect(got.unavailableProviders.commerce.vendor).toBe('not configured')
        expect(got.unavailableProviders.cms['broken-cms']).toBe(
          'credentials check failed'
        )
        expect(JSON.stringify(got)).not.toMatch(/VENDOR_KEY|401/)
      } finally {
        await app.close()
      }
    })
  })

  it("with the demo switch, each request's commerce provider decides", async () => {
    await jest.isolateModulesAsync(async () => {
      const fx: Fixtures = require('@test/category-split/fixtures')
      const kit: Kit = require('@core/integration-kit')
      useConfig(() =>
        kit.defineConfig({
          commerce: require('@demo/provider-switch').providerSwitch({
            commerce: [
              fx.inMemoryCommerce({
                id: 'plain',
                noWishlist: true,
                omits: ['wishlist'],
              }),
              fx.inMemoryCommerce({ id: 'full' }),
            ],
          }),
        })
      )
      exactEnv({ ...CORE_ENV })
      const switched = await boot()
      const { WishlistService } = bff('features/wishlist/wishlist.service')
      const { CapabilitiesController } = bff(
        'features/capabilities/capabilities.controller'
      )
      const as = async (provider: string) => {
        const r = await request(
          switched,
          {},
          {
            'x-commerce-provider': provider,
          }
        )
        return {
          caps: (await r.get(CapabilitiesController)).getCapabilities(),
          wishlist: await r.get(WishlistService),
        }
      }
      const plain = await as('plain')
      expect(plain.caps.services).toEqual({ wishlist: false })
      await expect(plain.wishlist.getWishlist()).rejects.toMatchObject({
        status: 501,
      })
      const full = await as('full')
      expect(full.caps.services).toEqual({ wishlist: true })
      // no wishlist cookie yet: none, without a 501
      expect(await full.wishlist.getWishlist()).toBeNull()
      await switched.close()
    })
  })
  it('switcher mode: a listed port without its variables is not loaded and is unavailable with the reason; the others serve', async () => {
    await jest.isolateModulesAsync(async () => {
      const fx: Fixtures = require('@test/category-split/fixtures')
      const kit: Kit = require('@core/integration-kit')
      const { remote, finder } = fixtures(fx)
      useConfig(() =>
        kit.defineConfig({
          commerce: remote,
          search: require('@demo/provider-switch').providerSwitch({
            search: [remote, finder],
          }),
        })
      )
      exactEnv({ ...CORE_ENV, ...REMOTE_ENV, ...REMOTE_SEARCH_ENV })
      const app = await boot()
      try {
        expect(loaded()).toEqual([
          'commerce:remote',
          'search:remote',
          'search:switch',
        ])
        const { unavailableDelegates } = bff('data-source/providers')
        expect(unavailableDelegates.search.finder).toBe('not configured')
      } finally {
        await app.close()
      }
    })
  })

  it("search through COMMERCE_SEARCH is this request's commerce provider's own product search; a search integration that needs another commerce falls back to it", async () => {
    await jest.isolateModulesAsync(async () => {
      const fx: Fixtures = require('@test/category-split/fixtures')
      const kit: Kit = require('@core/integration-kit')
      const { providerSwitch } = require('@demo/provider-switch')
      const { COMMERCE_SEARCH } = require('@demo/provider-switch/view')
      const first = fx.inMemoryCommerce({ id: 'first' })
      const second = fx.inMemoryCommerce({ id: 'second' })
      // like Algolia: an index fed from one commerce platform
      const finder = fx.contentOnly({
        id: 'finder',
        serves: ['search'],
        requires: {
          search: {
            needs: { commerce: 'first' },
            reason: 'the finder index is fed from first',
          },
        },
      })
      useConfig(() => {
        const switched = providerSwitch({
          commerce: [first, second],
          search: [COMMERCE_SEARCH, finder],
        })
        return kit.defineConfig({ commerce: switched, search: switched })
      })
      exactEnv({ ...CORE_ENV })
      const app = await boot()
      const { Services } = bff('data-source/ports.module')
      const { CapabilitiesController } = bff(
        'features/capabilities/capabilities.controller'
      )
      const as = async (commerce: string, search: string) => {
        const r = await request(
          app,
          {},
          { 'x-commerce-provider': commerce, 'x-search-provider': search }
        )
        const services = await r.get(Services)
        return {
          search: (await r.get(CapabilitiesController)).getCapabilities()
            .providers.search,
          // the fixtures' search members are stubs: the error names who served the call
          served: r
            .serve(async () =>
              services.searchService.searchProducts({
                query: 'shirt',
                language: 'en-US',
              })
            )
            .then(
              () => 'resolved',
              (e: Error) => e.message
            ),
        }
      }
      try {
        const own = await as('second', COMMERCE_SEARCH)
        expect(own.search).toBe(COMMERCE_SEARCH)
        expect(await own.served).toBe(
          'fixture second: productSearchService.searchProducts is not implemented'
        )
        const index = await as('first', 'finder')
        expect(index.search).toBe('finder')
        expect(await index.served).toBe(
          'fixture finder: searchService.searchProducts is not implemented'
        )
        // the finder needs commerce "first": over "second" the request gets the commerce platform's own search
        const fallback = await as('second', 'finder')
        expect(fallback.search).toBe(COMMERCE_SEARCH)
        expect(await fallback.served).toBe(
          'fixture second: productSearchService.searchProducts is not implemented'
        )
      } finally {
        await app.close()
      }
    })
  })

  it('COMMERCE_SEARCH in a list other than search fails the config', () => {
    const fx: Fixtures = jest.requireActual('@test/category-split/fixtures')
    const { local } = fixtures(fx)
    const { COMMERCE_SEARCH } = jest.requireActual('@demo/provider-switch/view')
    expect(() =>
      jest.requireActual('@demo/provider-switch').providerSwitch({
        commerce: [local, COMMERCE_SEARCH],
      })
    ).toThrow('commerce lists "commerce", which only search offers')
  })

  it('with the switch, a first provider that cannot serve fails the config instead of falling back', () => {
    const fx: Fixtures = jest.requireActual('@test/category-split/fixtures')
    const { remote, local } = fixtures(fx)
    expect(() =>
      jest.requireActual('@demo/provider-switch').providerSwitch({
        commerce: [local, remote],
        search: [remote, local],
      })
    ).toThrow('search lists "remote" first, but it cannot serve')
  })
  it('switcher on: per-request resolution by the demo switch; still no request-scoped provider in core or ports', async () => {
    const o = await inspect((fx, kit) => {
      const remote = fx.inMemoryCommerce({
        id: 'remote',
        also: ['search'],
        guestSession: true,
      })
      const local = fx.inMemoryCommerce({
        id: 'local',
        also: ['search', 'cms'],
      })
      const switched = require('@demo/provider-switch').providerSwitch({
        commerce: [remote, local],
        search: [remote, local],
      })
      return kit.defineConfig({
        commerce: switched,
        search: switched,
        cms: local,
      })
    })
    // the switch serves commerce and search through both platforms: their ports load next to its own
    expect(o.ports).toEqual([
      'commerce:remote',
      'commerce:local',
      'commerce:switch',
      'search:remote',
      'search:local',
      'search:switch',
      'cms:local',
    ])
    expect(o.portModulesFound).toEqual(o.portModulesExpected)
    expect(o.checked).toBeGreaterThanOrEqual(7 * 4)
    expect(o.requestScoped).toEqual([])
    // the switch forwards each call to this request's provider: the services object itself is a singleton
    expect(o.factoryStatic).toBe(true)
    expect(o.commerceWithLocalHeader).toBe('local')
    expect(o.storefrontHeaders).toEqual([
      'X-Commerce-Provider',
      'X-Search-Provider',
    ])
  })
})
