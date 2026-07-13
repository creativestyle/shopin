'use server'

import { cache } from 'react'
import { createBffFetchServer } from '@/lib/bff/core/bff-fetch-server'
import { StoreConfigService } from './store-config-service'
import type { StoreConfigResponse } from '@core/contracts/store-config/store-config'

export const getStoreConfig = cache(async (): Promise<StoreConfigResponse> => {
  const bffFetch = await createBffFetchServer()
  const service = new StoreConfigService(bffFetch)
  return await service.getStoreConfig()
})
