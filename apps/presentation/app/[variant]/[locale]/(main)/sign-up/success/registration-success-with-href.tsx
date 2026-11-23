'use client'

import { useSearchParams } from 'next/navigation'
import { RegistrationSuccess } from '@/features/auth/auth-registration-success'
import { useHasCompletedRegistration } from '@/features/auth/auth-registration-flag'
import { RedirectWhen } from '@/components/redirect-when'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { setIsCheckoutFromSearchParams } from '@/features/checkout/checkout-param-utils'

/**
 * Wraps RegistrationSuccess and builds verify-email URL from page context. Page owns the URL.
 * Sends visitors who did not just register back to the homepage.
 */
export function RegistrationSuccessWithHref() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const didRegister = useHasCompletedRegistration()

  const params = new URLSearchParams()
  if (token) {
    params.set('token', token)
  }
  setIsCheckoutFromSearchParams(params, searchParams)
  const verifyEmailHref = `/sign-up/verify-email?${params.toString()}`

  return (
    <RedirectWhen
      when={didRegister === false}
      redirectTo='/'
      isLoading={didRegister === null}
      loadingComponent={<LoadingSpinner className='size-8' />}
    >
      <RegistrationSuccess verifyEmailHref={verifyEmailHref} />
    </RedirectWhen>
  )
}
