import { NAVIGATION_REVALIDATE_SECONDS } from '@config/constants'
import {
  MainNavigationResponse,
  MainNavigationResponseSchema,
} from '@core/contracts/navigation/main-navigation'
import { BaseService } from '@/lib/bff/services/base-service'

/**
 * Service for navigation operations
 */
export class NavigationService extends BaseService {
  async getMainNavigation(): Promise<MainNavigationResponse | null> {
    const data = await this.get<MainNavigationResponse>('/navigation', {
      next: { revalidate: NAVIGATION_REVALIDATE_SECONDS },
    })
    return data ? MainNavigationResponseSchema.parse(data) : null
  }
}
