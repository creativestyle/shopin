'use client'

import { useCustomer } from '@/features/customer/customer-use-customer'
import { RedirectWhen } from '@/components/redirect-when'

interface ProtectedPageGuardProps {
  children: React.ReactNode
  /** Where to redirect when user is not authenticated. Provided by the page/layout. */
  redirectTo: string
}

/**
 * For protected pages (e.g. account): redirect when not logged in.
 * Page/layout owns redirect destination; uses useCustomer + RedirectWhen.
 */
export function ProtectedPageGuard({
  children,
  redirectTo,
}: ProtectedPageGuardProps) {
  const { isLoggedIn, isLoading } = useCustomer()

  return (
    <RedirectWhen
      when={!isLoggedIn}
      redirectTo={redirectTo}
      isLoading={isLoading}
    >
      {children}
    </RedirectWhen>
  )
}
