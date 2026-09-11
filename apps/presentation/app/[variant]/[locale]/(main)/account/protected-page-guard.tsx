'use client'

import { usePathname } from 'next/navigation'
import { useCustomer } from '@/features/customer/customer-use-customer'
import { RedirectWhen } from '@/components/redirect-when'
import { setReturnTo } from '@/lib/return-to'

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
  const pathname = usePathname()

  const params = new URLSearchParams()
  setReturnTo(params, pathname)
  const query = params.toString()

  return (
    <RedirectWhen
      when={!isLoggedIn}
      redirectTo={query ? `${redirectTo}?${query}` : redirectTo}
      isLoading={isLoading}
    >
      {children}
    </RedirectWhen>
  )
}
