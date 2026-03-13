import {
  ContentPageResponseSchema,
  ContentSlugSchema,
} from '@core/contracts/content/page'
import type { ContentPageResponse } from '@core/contracts/content/page'
import {
  HeaderResponseSchema,
  FooterResponseSchema,
} from '@core/contracts/content/layout'
import type {
  HeaderResponse,
  FooterResponse,
} from '@core/contracts/content/layout'
import { BaseService } from '@/lib/bff/services/base-service'
import type { BffCacheOptions } from '@/lib/bff/bff-cache-options'

/**
 * Service for content operations (page, header, footer) from BFF.
 * Draft mode header is added automatically by bff-fetch when the signed draft cookie is present.
 * Pass cache options from getBffCacheOptions() for correct caching vs no-store in draft.
 */
export class ContentService extends BaseService {
  /**
   * Get content page by slug.
   * @param slug - Content page slug
   * @param options - Cache options (e.g. from getBffCacheOptions())
   */
  async getContentPage(
    slug: string,
    options?: BffCacheOptions
  ): Promise<ContentPageResponse> {
    ContentSlugSchema.parse(slug)
    const path = `/content/page/${encodeURIComponent(slug)}`
    const data = await this.get<ContentPageResponse>(path, options)
    if (!data) {
      throw new Error('Content page not found')
    }
    return ContentPageResponseSchema.parse(data)
  }

  /**
   * Get header content.
   * @param options - Cache options (e.g. from getBffCacheOptions())
   */
  async getHeader(options?: BffCacheOptions): Promise<HeaderResponse | null> {
    try {
      const data = await this.get<HeaderResponse>('/content/header', options)
      return data ? HeaderResponseSchema.parse(data) : null
    } catch {
      return null
    }
  }

  /**
   * Get footer content.
   * @param options - Cache options (e.g. from getBffCacheOptions())
   */
  async getFooter(options?: BffCacheOptions): Promise<FooterResponse | null> {
    try {
      const data = await this.get<FooterResponse>('/content/footer', options)
      return data ? FooterResponseSchema.parse(data) : null
    } catch {
      return null
    }
  }
}
