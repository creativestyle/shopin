'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { usePathname } from '@/lib/navigation'
import { useCustomer } from '@/features/customer/customer-use-customer'
import { RedirectWhen } from '@/components/redirect-when'
import { Button } from '@/components/ui/button'
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
  const t = useTranslations('account.myAccount')
  const { isLoggedIn, isLoading, error, refetch } = useCustomer()
  const pathname = usePathname()
  const search = useSearchParams().toString()

  // A failed query after a server-confirmed session is not a sign-out
  if (isVerifiedOnServer && error && !isLoggedIn) {
    return (
      <div
        role='status'
        className='mx-auto my-16 flex max-w-md flex-col items-center gap-6 px-3 text-center'
      >
        <p className='text-base text-gray-700'>{t('customerLoadError')}</p>
        <Button
          variant='primary'
          scheme='red'
          onClick={() => refetch()}
        >
          {t('customerLoadRetry')}
        </Button>
      </div>
    )
  }

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
