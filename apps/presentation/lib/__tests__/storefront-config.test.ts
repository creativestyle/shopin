/**
 * @jest-environment node
 */
/**
 * The storefront reads the shop's storefront data from the file setup writes (`@shopin/storefront/
 * storefront-data.json`), not from an env value only next.config.ts sets: a build or a test runner without
 * next.config.ts still has it.
 */
import { FIXTURE_STOREFRONT } from '@/lib/variant/__fixtures__/storefront'

it('loads the storefront data without any SHOPIN_STOREFRONT in the environment', () => {
  const before = process.env.SHOPIN_STOREFRONT
  delete process.env.SHOPIN_STOREFRONT
  try {
    let mod: typeof import('../storefront-config') | undefined
    jest.isolateModules(() => {
      mod = require('../storefront-config')
    })
    expect(mod!.STOREFRONT).toEqual(FIXTURE_STOREFRONT)
  } finally {
    if (before !== undefined) {
      process.env.SHOPIN_STOREFRONT = before
    }
  }
})
