import { Injectable, Inject } from '@nestjs/common'
import { COMMERCETOOLS_CLIENT, Client } from '../client/client.module'
import type { StoreConfigResponse } from '@core/contracts/store-config/store-config'
import { StoreConfigApiResponseSchema } from '../schemas/store-config'

@Injectable()
export class StoreConfigService {
  constructor(@Inject(COMMERCETOOLS_CLIENT) private readonly client: Client) {}

  async getStoreConfig(): Promise<StoreConfigResponse> {
    const storeResponse = await this.client.get().execute()
    return StoreConfigApiResponseSchema.parse(storeResponse.body)
  }
}
