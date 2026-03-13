import { cache } from 'react'
import type { MainNavigationResponse } from '@core/contracts/navigation/main-navigation'
import { createBffFetchServer } from '@/lib/bff/core/bff-fetch-server'
import { NavigationService } from './navigation-service'

/**
 * Fetch main navigation data. Cached per request when called from server components.
 * Used only inside the navigation feature. Returns null on any failure so the page can still render (empty nav).
 */
export const getMainNavigation = cache(
  async (): Promise<MainNavigationResponse | null> => {
    try {
      const bffFetch = await createBffFetchServer()
      const navigationService = new NavigationService(bffFetch)
      return await navigationService.getMainNavigation()
    } catch {
      return null
    }
  }
)
