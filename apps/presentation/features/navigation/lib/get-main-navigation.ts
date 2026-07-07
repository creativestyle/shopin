import { cache } from 'react'
import type { MainNavigationResponse } from '@core/contracts/navigation/main-navigation'
import { createBffFetchServer } from '@/lib/bff/core/bff-fetch-server'
import { getBffCacheOptions } from '@/lib/bff/bff-cache-options'
import { NAVIGATION_REVALIDATE_SECONDS } from '@config/constants'
import { NavigationService } from './navigation-service'

/**
 * Fetch main navigation data. Cached per request when called from server components.
 * Used only inside the navigation feature. Returns null on any failure so the page can still render (empty nav).
 */
export const getMainNavigation = cache(
  async (isDraft = false): Promise<MainNavigationResponse | null> => {
    try {
      const bffFetch = await createBffFetchServer({ isDraft })
      const navigationService = new NavigationService(bffFetch)
      return await navigationService.getMainNavigation(
        getBffCacheOptions(NAVIGATION_REVALIDATE_SECONDS, { isDraft })
      )
    } catch {
      return null
    }
  }
)
