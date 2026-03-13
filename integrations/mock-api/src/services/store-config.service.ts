import { Injectable } from '@nestjs/common'
import type { StoreConfigResponse } from '@core/contracts/store-config/store-config'

@Injectable()
export class StoreConfigService {
  async getStoreConfig(): Promise<StoreConfigResponse> {
    return {
      countries: ['PL', 'DE', 'FR', 'GB'],
    }
  }
}
