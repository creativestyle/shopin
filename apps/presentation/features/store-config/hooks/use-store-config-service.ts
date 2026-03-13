'use client'

import { useBffFetchClient } from '@/lib/bff/core/bff-fetch-client'
import { StoreConfigService } from '../lib/store-config-service'

/**
 * Returns the store config BFF service for the current client.
 * Internal to store-config feature; use store config provider/hooks from outside.
 */
export function useStoreConfigService() {
  const bffFetch = useBffFetchClient()
  return { storeConfigService: new StoreConfigService(bffFetch) }
}
