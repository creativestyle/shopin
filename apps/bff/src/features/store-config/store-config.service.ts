import { Injectable, Scope } from '@nestjs/common'
import type { StoreConfigResponse } from '@core/contracts/store-config/store-config'
import { Services } from '../../data-source/ports.module'

@Injectable({ scope: Scope.REQUEST })
export class StoreConfigService {
  constructor(private readonly services: Services) {}

  async getStoreConfig(): Promise<StoreConfigResponse> {
    const { storeConfigService } = this.services
    return storeConfigService.getStoreConfig()
  }
}
