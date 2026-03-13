'use client'

import { useBffFetchClient } from '@/lib/bff/core/bff-fetch-client'
import { CustomerService } from '../lib/customer-bff-service'

/**
 * Returns the customer BFF service instance for the current client.
 */
export function useCustomerService() {
  const bffFetch = useBffFetchClient()
  return { customerService: new CustomerService(bffFetch) }
}
