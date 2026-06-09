/**
 * @jest-environment node
 */
/**
 * getProductCollectionPage is the server-side loader for category/collection
 * listing pages. It applies the same live-vs-draft caching rule as the product
 * detail loader:
 *
 *   - Live  → ISR-cached with PRODUCT_COLLECTION_PAGE_REVALIDATE_SECONDS.
 *   - Draft → cache: 'no-store' to prevent draft content from polluting the
 *             live ISR cache and being served to real shoppers.
 *
 * Tests verify that isDraft threads through getBffCacheOptions and reaches the
 * service as the final positional argument (cacheOptions). They also confirm
 * that all filter/pagination arguments are forwarded verbatim.
 */

jest.mock('react', () => ({ cache: <T>(fn: T) => fn }))
jest.mock('@/lib/bff/core/bff-fetch-server', () => ({
  createBffFetchServer: jest.fn(),
}))
jest.mock('@/lib/bff/bff-cache-options', () => ({
  getBffCacheOptions: jest.fn(),
}))
jest.mock('../lib/product-collection-service', () => ({
  ProductCollectionService: jest.fn().mockImplementation(() => ({
    getProductCollectionPage: jest.fn(),
  })),
}))

import { getProductCollectionPage } from '../get-product-collection-page'
import { PRODUCT_COLLECTION_PAGE_REVALIDATE_SECONDS } from '@config/constants'
import { ProductCollectionService } from '../lib/product-collection-service'

const MOCK_RESPONSE = { items: [] }

function getServiceMock() {
  return jest.mocked(ProductCollectionService).mock.results[0].value as {
    getProductCollectionPage: jest.Mock
  }
}

describe('getProductCollectionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(
      jest.requireMock('@/lib/bff/core/bff-fetch-server')
        .createBffFetchServer as jest.Mock
    ).mockResolvedValue({ fetch: jest.fn() })
    ;(jest.mocked(ProductCollectionService) as jest.Mock).mockImplementation(
      () => ({
        getProductCollectionPage: jest.fn().mockResolvedValue(MOCK_RESPONSE),
      })
    )
  })

  function setCacheOpts(opts: object) {
    ;(
      jest.requireMock('@/lib/bff/bff-cache-options')
        .getBffCacheOptions as jest.Mock
    ).mockReturnValue(opts)
  }

  // Live visitors get ISR-cached collection pages; no draft header should be added.
  it('calls createBffFetchServer with isDraft: false by default', async () => {
    setCacheOpts({ next: { revalidate: 60 } })
    await getProductCollectionPage('collection-slug')
    expect(
      jest.requireMock('@/lib/bff/core/bff-fetch-server')
        .createBffFetchServer as jest.Mock
    ).toHaveBeenCalledWith({ isDraft: false })
  })

  // Ensures the collection-specific revalidate window is used, not the product one.
  it('calls getBffCacheOptions with the collection revalidate constant and isDraft: false', async () => {
    setCacheOpts({ next: { revalidate: 60 } })
    await getProductCollectionPage('collection-slug')
    expect(
      jest.requireMock('@/lib/bff/bff-cache-options')
        .getBffCacheOptions as jest.Mock
    ).toHaveBeenCalledWith(PRODUCT_COLLECTION_PAGE_REVALIDATE_SECONDS, {
      isDraft: false,
    })
  })

  // cacheOptions is the last positional arg; using lastCall[length-1] keeps the
  // test stable if new filter args are added to the signature in future.
  it('passes cache options to the service as the last positional argument', async () => {
    setCacheOpts({ next: { revalidate: 60 } })
    await getProductCollectionPage('slug')
    const callArgs = getServiceMock().getProductCollectionPage.mock
      .lastCall as unknown[]
    expect(callArgs[callArgs.length - 1]).toEqual({ next: { revalidate: 60 } })
  })

  // Draft pages must never enter the ISR cache.
  // Arg positions: slug, page, pageSize, sortKey, filters, onSale, priceMin, priceMax, isDraft.
  it('passes no-store cache options when isDraft is true', async () => {
    setCacheOpts({ cache: 'no-store' as const })
    await getProductCollectionPage(
      'draft-slug',
      1,
      10,
      'newest',
      undefined,
      false,
      undefined,
      undefined,
      true
    )
    expect(
      jest.requireMock('@/lib/bff/core/bff-fetch-server')
        .createBffFetchServer as jest.Mock
    ).toHaveBeenCalledWith({ isDraft: true })
    const callArgs = getServiceMock().getProductCollectionPage.mock
      .lastCall as unknown[]
    expect(callArgs[callArgs.length - 1]).toEqual({ cache: 'no-store' })
  })

  // Verifies the loader doesn't silently drop or reorder any filter/pagination
  // argument. Arg positions: slug, page, pageSize, sortKey, filters, onSale, priceMin, priceMax.
  it('forwards all positional filter args to the service', async () => {
    setCacheOpts({ next: { revalidate: 60 } })
    const filters = { color: ['red'] }
    await getProductCollectionPage(
      'slug',
      2,
      20,
      'price-asc',
      filters,
      true,
      100,
      500
    )
    const callArgs = getServiceMock().getProductCollectionPage.mock
      .lastCall as unknown[]
    expect(callArgs[0]).toBe('slug')
    expect(callArgs[1]).toBe(2)
    expect(callArgs[2]).toBe(20)
    expect(callArgs[3]).toBe('price-asc')
    expect(callArgs[4]).toBe(filters)
    expect(callArgs[5]).toBe(true)
    expect(callArgs[6]).toBe(100)
    expect(callArgs[7]).toBe(500)
  })
})
