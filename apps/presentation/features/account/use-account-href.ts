'use client'

import { useCustomer } from '@/features/customer/customer-use-customer'

/**
 * Hook that returns the appropriate account href based on login status.
 * Returns '/sign-in' if not logged in, '/account' if logged in.
 */
export function useAccountHref() {
  const { isLoggedIn, isLoading } = useCustomer()

  // During loading, default to /account (will redirect if needed)
  if (isLoading) {
    return '/account'
  }

  return isLoggedIn ? '/account' : '/sign-in'
}
