'use client'

import { useSearchParams } from 'next/navigation'
import { useCustomer } from '@/features/customer/customer-use-customer'
import { RedirectWhen } from '@/components/redirect-when'
import { getIsCheckout } from '@/features/checkout/checkout-param-utils'

interface AuthPageGuardProps {
  children: React.ReactNode
}

/**
 * For auth pages (sign-in, sign-up): redirect when already logged in.
 * Page owns redirect destination (checkout vs account); uses useCustomer + RedirectWhen.
 */
export function AuthPageGuard({ children }: AuthPageGuardProps) {
  const searchParams = useSearchParams()
  const { isLoggedIn, isLoading } = useCustomer()
  const redirectTo = getIsCheckout(searchParams) ? '/checkout' : '/account'

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
