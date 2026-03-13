'use client'

import { useQuery } from '@tanstack/react-query'
import { useCustomerService } from './hooks/use-customer-service'
import { customerKeys } from './customer-keys'

/**
 * Hook for querying customer addresses data.
 * Provides read-only access to addresses and related metadata.
 * @param enabled - Whether to enable the query (default: true). Set to false for guests.
 */
export function useCustomerAddresses(enabled: boolean = true) {
  const { customerService } = useCustomerService()

  const queryFn = async () => {
    return await customerService.getAddresses()
  }

  const {
    data: addressesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: customerKeys.addresses(),
    queryFn,
    enabled,
    retry: false,
    retryDelay: 1000,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000,
  })

  return {
    // Address data
    addresses: addressesData?.addresses ?? [],
    defaultShippingAddressId: addressesData?.defaultShippingAddressId,
    defaultBillingAddressId: addressesData?.defaultBillingAddressId,
    shippingAddressIds: addressesData?.shippingAddressIds ?? [],
    billingAddressIds: addressesData?.billingAddressIds ?? [],
    isLoading,
    error,
  }
}
