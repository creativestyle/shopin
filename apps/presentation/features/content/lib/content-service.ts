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

export class ContentService extends BaseService {
  async getContentPage(
    slug: string,
    cacheOptions: BffCacheOptions
  ): Promise<ContentPageResponse> {
    ContentSlugSchema.parse(slug)
    const path = `/content/page/${encodeURIComponent(slug)}`
    const data = await this.get<ContentPageResponse>(path, cacheOptions)
    if (!data) {
      throw new Error('Content page not found')
    }
    return ContentPageResponseSchema.parse(data)
  }

  async getHeader(
    cacheOptions: BffCacheOptions
  ): Promise<HeaderResponse | null> {
    try {
      const data = await this.get<HeaderResponse>(
        '/content/header',
        cacheOptions
      )
      return data ? HeaderResponseSchema.parse(data) : null
    } catch {
      return null
    }
  }

  async getFooter(
    cacheOptions: BffCacheOptions
  ): Promise<FooterResponse | null> {
    try {
      const data = await this.get<FooterResponse>(
        '/content/footer',
        cacheOptions
      )
      return data ? FooterResponseSchema.parse(data) : null
    } catch {
      return null
    }
  }
}
