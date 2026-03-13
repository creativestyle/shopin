import { Injectable } from '@nestjs/common'
import type { StoreConfigResponse } from '@core/contracts/store-config/store-config'
import { DataSourceFactory } from '../../data-source/data-source.factory'

@Injectable()
export class StoreConfigService {
  constructor(private readonly dataSourceFactory: DataSourceFactory) {}

  async getStoreConfig(): Promise<StoreConfigResponse> {
    const { storeConfigService } = this.dataSourceFactory.getServices()
    return storeConfigService.getStoreConfig()
  }
}
