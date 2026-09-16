import {
  MainNavigationResponseSchema,
  type MainNavigationResponse,
} from '@core/contracts/navigation/main-navigation'
import {
  FooterResponseSchema,
  type FooterResponse,
} from '@core/contracts/content/layout'
import {
  ProductCollectionPageResponseSchema,
  type ProductCollectionPageResponse,
} from '@core/contracts/product-collection/product-collection-page'
import { BaseService } from '@/lib/bff/services/base-service'
import type { BffCacheOptions } from '@/lib/bff/bff-cache-options'
import { logger } from '@/lib/logger'
import { DEFAULT_SORT_OPTION } from '@config/constants'

/**
 * BFF reads used by sitemap generation.
 *
 * Separate from the per-feature fetchers on purpose: the sitemap covers *all*
 * locales, so it cannot rely on fetchers that resolve the locale from the render
 * context. Every call returns null instead of throwing — a partial sitemap is far
 * better than a failed build or a 500 on /sitemap.xml.
 */
export class SitemapService extends BaseService {
  private async getOrNull<T>(
    path: string,
    schema: { parse: (data: unknown) => T },
    options: BffCacheOptions & {
      queryParams?: Record<string, string | number>
    }
  ): Promise<T | null> {
    try {
      const data = await this.get<unknown>(path, {
        ...options,
        onError: (res) => {
          logger.warn(
            { path, status: res.status },
            'Sitemap: BFF request failed'
          )
          return null
        },
        onNetworkError: (error) => {
          logger.warn(
            { path, error: error.message },
            'Sitemap: BFF request errored'
          )
          return null
        },
      })
      return data ? schema.parse(data) : null
    } catch (error) {
      logger.warn(
        { path, error: error instanceof Error ? error.message : String(error) },
        'Sitemap: unexpected BFF response'
      )
      return null
    }
  }

  async getNavigation(
    cacheOptions: BffCacheOptions
  ): Promise<MainNavigationResponse | null> {
    return this.getOrNull(
      '/navigation',
      MainNavigationResponseSchema,
      cacheOptions
    )
  }

  async getFooter(
    cacheOptions: BffCacheOptions
  ): Promise<FooterResponse | null> {
    return this.getOrNull('/content/footer', FooterResponseSchema, cacheOptions)
  }

  async getCollectionPage(
    slug: string,
    page: number,
    limit: number,
    cacheOptions: BffCacheOptions
  ): Promise<ProductCollectionPageResponse | null> {
    // Segments are encoded individually so a nested category slug keeps its
    // separators: the PLP route joins its catch-all segments with "/", and
    // encodeURIComponent on the whole slug would turn that into %2F and 404.
    const encodedSlug = slug.split('/').map(encodeURIComponent).join('/')
    return this.getOrNull(
      `/productCollection/slug/${encodedSlug}/page`,
      ProductCollectionPageResponseSchema,
      {
        ...cacheOptions,
        queryParams: { page, limit, sort: DEFAULT_SORT_OPTION },
      }
    )
  }
}
