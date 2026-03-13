import { Injectable } from '@nestjs/common'
import type { MainNavigationResponse } from '@core/contracts/navigation/main-navigation'
import { DataSourceFactory } from '../../data-source/data-source.factory'

@Injectable()
export class NavigationService {
  constructor(private readonly dataSourceFactory: DataSourceFactory) {}

  async getNavigation(): Promise<MainNavigationResponse> {
    const { navigationService } = this.dataSourceFactory.getServices()
    return await navigationService.getNavigation()
  }
}
