import {
  MainNavigationResponse,
  MainNavigationResponseSchema,
} from '@core/contracts/navigation/main-navigation'
import { BaseService } from '@/lib/bff/services/base-service'
import type { BffCacheOptions } from '@/lib/bff/bff-cache-options'

/**
 * Service for navigation operations
 */
export class NavigationService extends BaseService {
  async getMainNavigation(
    cacheOptions: BffCacheOptions
  ): Promise<MainNavigationResponse | null> {
    const data = await this.get<MainNavigationResponse>(
      '/navigation',
      cacheOptions
    )
    return data ? MainNavigationResponseSchema.parse(data) : null
  }
}
