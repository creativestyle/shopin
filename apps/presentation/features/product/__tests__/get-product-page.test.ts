/**
 * @jest-environment node
 */
/**
 * getProductPage is the server-side loader that fetches product data for the
 * product detail page. The central invariant these tests protect:
 *
 *   - Live requests  → ISR-cached with a finite revalidate window so CDN/Next.js
 *                       can serve stale-while-revalidate without hitting the BFF.
 *   - Draft requests → cache: 'no-store' so editors always see the latest CMS
 *                       content and draft pages can never leak into the live ISR cache.
 *
 * The getBffCacheOptions helper encodes this rule; these tests verify that
 * getProductPage threads the isDraft flag correctly through that helper and
 * all the way down to the service call.
 */

jest.mock('react', () => ({ cache: <T>(fn: T) => fn }))
jest.mock('@/lib/bff/core/bff-fetch-server', () => ({
  createBffFetchServer: jest.fn(),
}))
jest.mock('@/lib/bff/bff-cache-options', () => ({
  getBffCacheOptions: jest.fn(),
}))
jest.mock('../lib/product-service', () => ({
  ProductService: jest
    .fn()
    .mockImplementation(() => ({ getProductPage: jest.fn() })),
}))

import { getProductPage } from '../get-product-page'
import { PRODUCT_PAGE_REVALIDATE_SECONDS } from '@config/constants'
import { ProductService } from '../lib/product-service'

const MOCK_RESPONSE = { slug: 'test', product: {} }

function m() {
  const createBffFetchServer = jest.requireMock(
    '@/lib/bff/core/bff-fetch-server'
  ).createBffFetchServer as jest.Mock
  const getBffCacheOptions = jest.requireMock('@/lib/bff/bff-cache-options')
    .getBffCacheOptions as jest.Mock
  return { createBffFetchServer, getBffCacheOptions }
}

describe('getProductPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const mockFetch = jest.fn()
    ;(
      jest.requireMock('@/lib/bff/core/bff-fetch-server')
        .createBffFetchServer as jest.Mock
    ).mockResolvedValue({ fetch: mockFetch })
    ;(jest.mocked(ProductService) as jest.Mock).mockImplementation(() => ({
      getProductPage: jest.fn().mockResolvedValue(MOCK_RESPONSE),
    }))
  })

  // Live visitors get ISR-cached pages; bffFetchServer must not add draft headers.
  it('calls createBffFetchServer with isDraft: false by default', async () => {
    ;(
      jest.requireMock('@/lib/bff/bff-cache-options')
        .getBffCacheOptions as jest.Mock
    ).mockReturnValue({ next: { revalidate: 60 } })
    await getProductPage('some-slug')
    expect(m().createBffFetchServer).toHaveBeenCalledWith({ isDraft: false })
  })

  // Ensures the correct revalidate window is passed so ISR expiry is predictable.
  it('calls getBffCacheOptions with the revalidate constant and isDraft: false', async () => {
    ;(
      jest.requireMock('@/lib/bff/bff-cache-options')
        .getBffCacheOptions as jest.Mock
    ).mockReturnValue({ next: { revalidate: 60 } })
    await getProductPage('some-slug')
    expect(m().getBffCacheOptions).toHaveBeenCalledWith(
      PRODUCT_PAGE_REVALIDATE_SECONDS,
      { isDraft: false }
    )
  })

  // The service, not the loader, applies the cache options to the fetch call —
  // the loader must pass them through unchanged.
  it('passes cache options returned by getBffCacheOptions to the service', async () => {
    const cacheOpts = { next: { revalidate: 120 } }
    ;(
      jest.requireMock('@/lib/bff/bff-cache-options')
        .getBffCacheOptions as jest.Mock
    ).mockReturnValue(cacheOpts)
    await getProductPage('some-slug')
    const serviceInstance = jest.mocked(ProductService).mock.results[0]
      .value as { getProductPage: jest.Mock }
    expect(serviceInstance.getProductPage).toHaveBeenCalledWith(
      'some-slug',
      cacheOpts,
      undefined
    )
  })

  // Draft mode activates the BFF draft header so the BFF returns unpublished content.
  it('calls createBffFetchServer with isDraft: true when isDraft arg is true', async () => {
    ;(
      jest.requireMock('@/lib/bff/bff-cache-options')
        .getBffCacheOptions as jest.Mock
    ).mockReturnValue({ cache: 'no-store' })
    await getProductPage('draft-slug', undefined, true)
    expect(m().createBffFetchServer).toHaveBeenCalledWith({ isDraft: true })
  })

  // Draft pages must never enter the ISR cache — cache: 'no-store' prevents
  // a draft response from being served to live visitors after the editor's session ends.
  it('passes no-store cache options to the service when isDraft is true', async () => {
    const noStore = { cache: 'no-store' as const }
    ;(
      jest.requireMock('@/lib/bff/bff-cache-options')
        .getBffCacheOptions as jest.Mock
    ).mockReturnValue(noStore)
    await getProductPage('draft-slug', undefined, true)
    const serviceInstance = jest.mocked(ProductService).mock.results[0]
      .value as { getProductPage: jest.Mock }
    expect(serviceInstance.getProductPage).toHaveBeenCalledWith(
      'draft-slug',
      noStore,
      undefined
    )
  })

  // variantId selects the active product variant (size/colour); omitting it would
  // fall back to the default variant, which could display the wrong price/image.
  it('forwards variantId to the service', async () => {
    ;(
      jest.requireMock('@/lib/bff/bff-cache-options')
        .getBffCacheOptions as jest.Mock
    ).mockReturnValue({ next: { revalidate: 60 } })
    await getProductPage('slug', 'variant-1')
    const serviceInstance = jest.mocked(ProductService).mock.results[0]
      .value as { getProductPage: jest.Mock }
    expect(serviceInstance.getProductPage).toHaveBeenCalledWith(
      'slug',
      expect.anything(),
      'variant-1'
    )
  })
})
