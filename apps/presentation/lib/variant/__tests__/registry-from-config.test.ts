/**
 * @jest-environment node
 */
/**
 * The variant registry is derived from the shop config: no provider is written
 * in the storefront. These tests build their own config from fixture integrations
 * (lib/variant/__fixtures__/storefront.ts, the data jest.config.ts maps storefront-data.json to) and
 * compare, then derive a second config to show the registry follows whatever the config says.
 */
import { defineConfig } from '@core/integration-kit'
import { storefrontData } from '@core/integration-kit/core'
import { VARIANT_DIMENSIONS } from '../registry'
import { STOREFRONT } from '@/lib/storefront-config'
import {
  FIXTURE_CONFIG,
  FIXTURE_LISTS,
  finder,
  headless,
  local,
  remote,
  router,
} from '../__fixtures__/storefront'

type Registry = typeof import('../registry')

/** The registry built from another config's build-time data, in an isolated module registry. */
function registryFor(data: unknown): Registry['VARIANT_DIMENSIONS'] {
  let mod: Registry | undefined
  jest.isolateModules(() => {
    jest.doMock('@shopin/storefront/storefront-data.json', () => ({
      __esModule: true,
      default: data,
    }))
    mod = require('../registry')
  })
  jest.dontMock('@shopin/storefront/storefront-data.json')
  return mod!.VARIANT_DIMENSIONS
}

describe('variant registry from the shop config', () => {
  it('the build-time data equals the config', () => {
    expect(STOREFRONT).toEqual(storefrontData(FIXTURE_CONFIG))
  })

  it('has one dimension per category the router switches, in its order, from the variants it declares', () => {
    expect(VARIANT_DIMENSIONS.map((d) => d.name)).toEqual([
      'commerce',
      'search',
      'cms',
      'auth',
    ])
    for (const d of VARIANT_DIMENSIONS) {
      const ids = FIXTURE_LISTS[d.name as keyof typeof FIXTURE_LISTS].map(
        (i) => i.id
      )
      expect(d.allowed).toEqual(ids)
      expect(d.defaultValue).toBe(ids[0])
      expect(d.cookie).toBe(`shopin-${d.name}`)
      expect(d.header.toLowerCase()).toBe(`x-${d.name}-provider`)
    }
  })

  it('follows another config: reordered and removed providers, no router', () => {
    const lists = { commerce: [local, remote], search: [local, finder] }
    const reordered = defineConfig({
      commerce: router(lists),
      search: router(lists),
      cms: headless,
    })
    expect(
      registryFor(storefrontData(reordered)).map((d) => [
        d.name,
        d.allowed,
        d.defaultValue,
      ])
    ).toEqual([
      ['commerce', ['local', 'remote'], 'local'],
      ['search', ['local', 'finder'], 'local'],
    ])
    // a real shop: one provider per category, no dimension
    const single = defineConfig({ commerce: local, search: finder })
    expect(registryFor(storefrontData(single))).toEqual([])
  })
})
