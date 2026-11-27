import assert from 'node:assert/strict'
import { ProductResponseSchema } from '@core/contracts/product/product'
import { MainNavigationResponseSchema } from '@core/contracts/navigation/main-navigation'
import { StoreConfigResponseSchema } from '@core/contracts/store-config/store-config'
import { ProductCollectionResponseSchema } from '@core/contracts/product-collection/product-collection'
import type { CaseContext } from './types'
import { statusOf, rejectsWith } from './helpers'

/** Catalog: platform failures map to 502-504, products, categories, search, navigation. */
export function catalogCases(ctx: CaseContext): void {
  const { port, data, add, unique } = ctx
  if (data.product) {
    add(['productService'], {
      name: 'commerce: a platform that is down or answers 5xx is 502, 503 or 504, not 500 (for a port that calls it over fetch)',
      async run() {
        const real = globalThis.fetch
        const failures: [string, () => Response][] = [
          [
            'a network error',
            () => {
              throw new TypeError('fetch failed')
            },
          ],
          ['a 503', () => new Response('{}', { status: 503 })],
        ]
        for (const [what, failure] of failures) {
          let calls = 0
          globalThis.fetch = (async () => {
            calls++
            return failure()
          }) as typeof fetch
          let error: unknown
          try {
            const p = await port()
            await p.productService.getProduct(data.product!.slug)
          } catch (e) {
            error = e
          } finally {
            globalThis.fetch = real
          }
          // a port that does not reach its platform through the global fetch (an SDK with its own client, an
          // injected client, in memory): the failure cannot be injected here, so the case is not run (not a pass)
          if (calls === 0) {
            return "not tested: the port does not call the global fetch, so the suite cannot make its platform fail; test the 502/503/504 mapping with your client's own failure"
          }
          assert.ok(
            [502, 503, 504].includes(statusOf(error) ?? 0),
            `on ${what} expected 502, 503 or 504, got ${error === undefined ? 'an answer' : String(error)}`
          )
        }
      },
    })
  }
  const { product, category } = data
  if (product) {
    add(['navigationService', 'storeConfigService'], {
      name: "commerce: navigation and store config parse as SHOPin's contracts",
      async run() {
        const p = await port()
        MainNavigationResponseSchema.parse(
          await p.navigationService.getNavigation()
        )
        const config = StoreConfigResponseSchema.parse(
          await p.storeConfigService.getStoreConfig()
        )
        assert.ok(config.shippingCountries.length > 0, 'no shipping country')
      },
    })
    add(['productService'], {
      name: data.generatedCatalog
        ? 'commerce: a product by slug parses as the product contract'
        : 'commerce: a product by slug parses as the product contract; an unknown slug is 404',
      async run() {
        const p = await port()
        const found = ProductResponseSchema.parse(
          await p.productService.getProduct(product.slug)
        )
        if (!data.generatedCatalog) {
          assert.equal(found.product.slug, product.slug)
          await rejectsWith(
            404,
            p.productService.getProduct(`no-such-product-${unique()}`)
          )
        }
      },
    })
  }
  if (category) {
    add(['productCollectionService'], {
      name: 'commerce: a category page parses as the collection contract and keeps the page size',
      async run() {
        const p = await port()
        const page = ProductCollectionResponseSchema.parse(
          await p.productCollectionService.getProductCollection(
            category.slug,
            1,
            2
          )
        )
        assert.ok(page.productList.length > 0, 'the category has no product')
        assert.ok(
          page.productList.length <= 2,
          'more products than the page size'
        )
      },
    })
  }
}
