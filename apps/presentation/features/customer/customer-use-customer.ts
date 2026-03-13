'use client'

import { useQuery } from '@tanstack/react-query'
import { useCustomerService } from './hooks/use-customer-service'
import { customerKeys } from './customer-keys'
import { HttpError } from '@/lib/error-utils'

/**
 * Hook for customer data (logged-in user profile).
 * Returns customer, loading state, and isLoggedIn.
 */
export function useCustomer() {
  const { customerService } = useCustomerService()

  const queryFn = async () => {
    return await customerService.getCurrentCustomer()
  }

  const {
    data: customer,
    isLoading,
    error,
  } = useQuery({
    queryKey: customerKeys.me(),
    queryFn,
    retry: (failureCount, error) => {
      if (HttpError.isAuthError(error)) {
        return false
      }
      return failureCount < 1
    },
    retryDelay: 1000,
    staleTime: 30 * 1000,
    gcTime: 60 * 1000,
  })

  return {
    customer: customer ?? undefined,
    isLoading,
    error,
    isLoggedIn: !!customer,
  }
}
