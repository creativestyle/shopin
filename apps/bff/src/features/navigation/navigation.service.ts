import { Injectable } from '@nestjs/common'
import type { MainNavigationResponse } from '@core/contracts/navigation/main-navigation'
import { Services } from '../../data-source/ports.module'

@Injectable()
export class NavigationService {
  constructor(private readonly services: Services) {}

  async getNavigation(): Promise<MainNavigationResponse> {
    const { navigationService } = this.services
    return await navigationService.getNavigation()
  }
}
