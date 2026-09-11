'use client'

import { useSearchParams } from 'next/navigation'
import { useCustomer } from '@/features/customer/customer-use-customer'
import { RedirectWhen } from '@/components/redirect-when'
import { getReturnTo } from '@/lib/return-to'

interface AuthPageGuardProps {
  children: React.ReactNode
}

/**
 * For auth pages (sign-in, sign-up): redirect when already logged in.
 * Destination comes from the returnTo param, falling back to the account overview.
 */
export function AuthPageGuard({ children }: AuthPageGuardProps) {
  const searchParams = useSearchParams()
  const { isLoggedIn, isLoading } = useCustomer()
  const redirectTo = getReturnTo(searchParams) ?? '/account'

  return (
    <RedirectWhen
      when={isLoggedIn}
      redirectTo={redirectTo}
      isLoading={isLoading}
    >
      {children}
    </RedirectWhen>
  )
}
