'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ConfirmEmail } from '@/features/auth/auth-confirm-email'
import { setReturnToFromSearchParams } from '@/lib/return-to'

/**
 * Wraps ConfirmEmail and performs redirect on verification. Page owns the redirect destination.
 */
export function VerifyEmailWithRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const onVerified = () => {
    const params = new URLSearchParams()
    setReturnToFromSearchParams(params, searchParams)
    router.replace(`/sign-in?${params.toString()}`)
  }

  return <ConfirmEmail onVerified={onVerified} />
}
