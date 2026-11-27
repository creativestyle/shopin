'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/lib/navigation'
import { ConfirmEmail } from '@/features/auth/auth-confirm-email'
import { clearRegistrationCompleted } from '@/features/auth/auth-registration-flag'
import { SIGN_IN_CONFIRMATION_PARAMS } from '@/features/auth/auth-sign-in-confirmation'
import { setReturnToFromSearchParams } from '@/lib/return-to'

/**
 * Wraps ConfirmEmail and performs redirect on verification. Page owns the redirect destination.
 */
export function VerifyEmailWithRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    clearRegistrationCompleted()
  }, [])

  const onVerified = () => {
    const params = new URLSearchParams()
    params.set(SIGN_IN_CONFIRMATION_PARAMS.emailVerified, 'true')
    setReturnToFromSearchParams(params, searchParams)
    router.replace(`/sign-in?${params.toString()}`)
  }

  return <ConfirmEmail onVerified={onVerified} />
}
