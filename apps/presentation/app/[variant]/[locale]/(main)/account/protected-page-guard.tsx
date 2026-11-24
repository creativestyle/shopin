'use client'

import { useSearchParams } from 'next/navigation'
import { usePathname } from '@/lib/navigation'
import { useCustomer } from '@/features/customer/customer-use-customer'
import { RedirectWhen } from '@/components/redirect-when'
import { setReturnTo } from '@/lib/return-to'

interface ProtectedPageGuardProps {
  children: React.ReactNode
  /** Where to redirect when user is not authenticated. Provided by the page/layout. */
  redirectTo: string
  /** Server already confirmed a signed-in customer: render children while the client check loads. */
  isVerifiedOnServer?: boolean
}

/**
 * For protected pages (e.g. account): redirect when not logged in.
 * Page/layout owns redirect destination; uses useCustomer + RedirectWhen.
 */
export function ProtectedPageGuard({
  children,
  redirectTo,
  isVerifiedOnServer = false,
}: ProtectedPageGuardProps) {
  const { isLoggedIn, isLoading } = useCustomer()
  const pathname = usePathname()
  const search = useSearchParams().toString()

  const params = new URLSearchParams()
  setReturnTo(params, search ? `${pathname}?${search}` : pathname)
  const query = params.toString()

  return (
    <RedirectWhen
      when={!isLoading && !isLoggedIn}
      redirectTo={query ? `${redirectTo}?${query}` : redirectTo}
      isLoading={isLoading && !isVerifiedOnServer}
    >
      {children}
    </RedirectWhen>
  )
}
