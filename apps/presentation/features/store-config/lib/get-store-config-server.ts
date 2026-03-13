'use server'

import { createBffFetchServer } from '@/lib/bff/core/bff-fetch-server'
import { StoreConfigService } from './store-config-service'
import type { StoreConfigResponse } from '@core/contracts/store-config/store-config'

/**
 * Get store configuration for server-side usage (e.g. layout).
 */
export async function getStoreConfig(): Promise<StoreConfigResponse> {
  const bffFetch = await createBffFetchServer()
  const service = new StoreConfigService(bffFetch)
  return await service.getStoreConfig()
}
