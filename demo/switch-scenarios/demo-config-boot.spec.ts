/**
 * The demo's real config (demo/shop/config, `@demo/shop/config`), booted as the BFF runs it with the core's
 * variables only: the vendors whose variables are missing (commercetools, Contentful, Algolia) are passed over,
 * the BFF starts and `/bff/capabilities` answers over HTTP, every configured category served by the mock data and
 * the vendors listed as not configured.
 */
import type { ShopinConfig } from '@core/integration-kit/core'
import {
  CORE_ENV,
  exactEnv,
  boot,
  http,
  useConfig,
} from '@test/category-split/harness'

describe('demo/shop/config boots', () => {
  it('/bff/capabilities: every configured category is served, the vendors without variables are not configured', async () => {
    let config: ShopinConfig | undefined
    useConfig(() => {
      config = (
        jest.requireActual('@demo/shop/config') as { config: ShopinConfig }
      ).config
      return config
    })
    exactEnv({ ...CORE_ENV })
    const server = await http(await boot())
    try {
      const { status, body } = await server.fetch('/bff/capabilities')
      expect(status).toBe(200)
      const { categoriesOf } = jest.requireActual('@core/integration-kit/core')
      const configured: string[] = categoriesOf(config!)
      expect(configured.sort()).toEqual(
        ['auth', 'cms', 'commerce', 'psp', 'search'].sort()
      )
      for (const category of configured) {
        expect({ category, reason: body.unavailable[category] }).toEqual({
          category,
          reason: undefined,
        })
        expect({ category, provider: body.providers[category] }).toEqual({
          category,
          provider: expect.any(String),
        })
      }
      // no vendor variables: the mock data serves every category, the vendors are passed over and named
      expect(body.providers).toEqual({
        commerce: 'mock',
        search: 'commerce',
        cms: 'mock',
        psp: 'mock',
        auth: 'mock-identity',
      })
      expect(body.unavailableProviders).toEqual({
        commerce: { commercetools: 'not configured' },
        search: { algolia: 'not configured' },
        cms: { contentful: 'not configured' },
        auth: { commercetools: 'not configured' },
      })
    } finally {
      await server.close()
    }
  })
})
