'use client'

import { useSearchParams } from 'next/navigation'
import { RegistrationSuccess } from '@/features/auth/auth-registration-success'
import { setReturnToFromSearchParams } from '@/lib/return-to'

/**
 * Wraps RegistrationSuccess and builds verify-email URL from page context. Page owns the URL.
 */
export function RegistrationSuccessWithHref() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const params = new URLSearchParams()
  if (token) {
    params.set('token', token)
  }
  setReturnToFromSearchParams(params, searchParams)
  const verifyEmailHref = `/sign-up/verify-email?${params.toString()}`

  return <RegistrationSuccess verifyEmailHref={verifyEmailHref} />
}
