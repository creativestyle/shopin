import { cache } from 'react'
import type {
  HeaderResponse,
  FooterResponse,
} from '@core/contracts/content/layout'
import { getBffCacheOptions } from '@/lib/bff/bff-cache-options'
import { createBffFetchServer } from '@/lib/bff/core/bff-fetch-server'
import { ContentService } from './lib/content-service'

export const getHeaderLayout = cache(
  async (isDraft = false): Promise<HeaderResponse | null> => {
    const bffFetch = await createBffFetchServer({ isDraft })
    const contentService = new ContentService(bffFetch)
    return contentService.getHeader(getBffCacheOptions(undefined, { isDraft }))
  }
)

export const getFooterLayout = cache(
  async (isDraft = false): Promise<FooterResponse | null> => {
    const bffFetch = await createBffFetchServer({ isDraft })
    const contentService = new ContentService(bffFetch)
    return contentService.getFooter(getBffCacheOptions(undefined, { isDraft }))
  }
)
