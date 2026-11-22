/**
 * @jest-environment node
 */
import {
  SITEMAP_COLLECTION_PAGE_SIZE,
  SITEMAP_MAX_COLLECTION_RESULTS,
} from '@config/constants'
import { logger } from '@/lib/logger'
import { getSitemapEntries } from '../get-sitemap-entries'

const service = {
  getNavigation: jest.fn(),
  getFooter: jest.fn(),
  getCollectionPage: jest.fn(),
}

jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn() },
}))
jest.mock('@/lib/bff/core/bff-fetch-server', () => ({
  createBffFetchServer: jest.fn().mockResolvedValue({}),
}))
jest.mock('@/lib/bff/bff-cache-options', () => ({
  getBffCacheOptions: () => ({}),
}))
jest.mock('../lib/sitemap-service', () => ({
  SitemapService: jest.fn().mockImplementation(() => service),
}))

const BASE = 'https://shop.example'

function mockCategoryWithTotal(total: number) {
  service.getCollectionPage.mockImplementation(
    async (_slug: string, page: number, limit: number) => {
      const start = (page - 1) * limit
      const count = Math.max(0, Math.min(limit, total - start))
      return {
        total,
        productList: Array.from({ length: count }, (_, i) => ({
          slug: `product-${start + i}`,
        })),
      }
    }
  )
}

function productCallsPerLocale() {
  return service.getCollectionPage.mock.calls.length / 2
}

describe('getSitemapEntries product paging', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    service.getNavigation.mockResolvedValue({
      items: [{ text: 'Audio', href: '/c/audio' }],
    })
    service.getFooter.mockResolvedValue(null)
  })

  it('pages a category until its total is covered', async () => {
    mockCategoryWithTotal(250)

    const entries = await getSitemapEntries(BASE)

    expect(productCallsPerLocale()).toBe(
      Math.ceil(250 / SITEMAP_COLLECTION_PAGE_SIZE)
    )
    expect(entries.filter((e) => e.url.includes('/p/'))).toHaveLength(500)
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('stops at the pageable result window and warns about the rest', async () => {
    mockCategoryWithTotal(SITEMAP_MAX_COLLECTION_RESULTS + 5000)

    await getSitemapEntries(BASE)

    expect(productCallsPerLocale()).toBe(
      SITEMAP_MAX_COLLECTION_RESULTS / SITEMAP_COLLECTION_PAGE_SIZE
    )
    const lastOffset =
      (Math.max(
        ...service.getCollectionPage.mock.calls.map(([, page]) => page)
      ) -
        1) *
      SITEMAP_COLLECTION_PAGE_SIZE
    expect(lastOffset).toBeLessThan(SITEMAP_MAX_COLLECTION_RESULTS)
    expect(logger.warn).toHaveBeenCalledWith(
      {
        categoryPath: '/c/audio',
        total: SITEMAP_MAX_COLLECTION_RESULTS + 5000,
        reachable: SITEMAP_MAX_COLLECTION_RESULTS,
      },
      expect.stringContaining('more products than its listing can be paged to')
    )
  })
})
