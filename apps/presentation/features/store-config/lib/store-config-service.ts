import { STORE_CONFIG_REVALIDATE_SECONDS } from '@config/constants'
import type { StoreConfigResponse } from '@core/contracts/store-config/store-config'
import { BaseService } from '@/lib/bff/services/base-service'

export class StoreConfigService extends BaseService {
  async getStoreConfig(): Promise<StoreConfigResponse> {
    return await this.get<StoreConfigResponse>('/store-config', {
      next: {
        revalidate: STORE_CONFIG_REVALIDATE_SECONDS,
      },
    })
  }
}
