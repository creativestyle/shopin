'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/lib/navigation'
import { ConfirmEmail } from '@/features/auth/auth-confirm-email'
import { SIGN_IN_CONFIRMATION_PARAMS } from '@/features/auth/auth-sign-in-confirmation'
import { setIsCheckoutFromSearchParams } from '@/features/checkout/checkout-param-utils'

/**
 * Wraps ConfirmEmail and performs redirect on verification. Page owns the redirect destination.
 */
export function VerifyEmailWithRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const onVerified = () => {
    const params = new URLSearchParams()
    params.set(SIGN_IN_CONFIRMATION_PARAMS.emailVerified, 'true')
    setIsCheckoutFromSearchParams(params, searchParams)
    router.replace(`/sign-in?${params.toString()}`)
  }

  return <ConfirmEmail onVerified={onVerified} />
}
