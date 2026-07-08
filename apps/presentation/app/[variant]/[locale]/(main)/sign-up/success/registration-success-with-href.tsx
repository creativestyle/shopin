'use client'

import { useSearchParams } from 'next/navigation'
import { RegistrationSuccess } from '@/features/auth/auth-registration-success'
import { setIsCheckoutFromSearchParams } from '@/features/checkout/checkout-param-utils'

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
  setIsCheckoutFromSearchParams(params, searchParams)
  const verifyEmailHref = `/sign-up/verify-email?${params.toString()}`

  return <RegistrationSuccess verifyEmailHref={verifyEmailHref} />
}
