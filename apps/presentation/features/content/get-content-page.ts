import { cache } from 'react'
import type { ContentPageResponse } from '@core/contracts/content/page'
import { getBffCacheOptions } from '@/lib/bff/bff-cache-options'
import { createBffFetchServer } from '@/lib/bff/core/bff-fetch-server'
import { ContentService } from './lib/content-service'

/**
 * Fetch content page data by slug. Cached per request when called from server components.
 * Locale is taken from next-intl (request [locale] segment); the BFF sends it as Accept-Language
 * and Contentful returns the page in that locale (en-US or de-DE). Use locale-specific slugs for
 * the homepage (e.g. getHomepageSlugForLocale from ./homepage-slug with await getLocale()).
 * When draft mode is enabled (via /api/draft with valid secret), BFF uses preview API.
 */
export const getContentPage = cache(
  async (slug: string): Promise<ContentPageResponse> => {
    const bffFetch = await createBffFetchServer()
    const contentService = new ContentService(bffFetch)
    return contentService.getContentPage(slug, await getBffCacheOptions())
  }
)
