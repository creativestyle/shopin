'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { RegisterForm } from '@/features/auth/auth-register-form'
import { setIsCheckoutFromSearchParams } from '@/features/checkout/checkout-param-utils'

/**
 * Renders RegisterForm and redirects on success. Page owns the redirect destination.
 */
export function SignUpFormWithRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const onSuccess = (emailToken?: string) => {
    const params = new URLSearchParams()
    if (emailToken) {
      params.set('token', emailToken)
    }
    setIsCheckoutFromSearchParams(params, searchParams)
    router.push(`/sign-up/success?${params.toString()}`)
  }

  return <RegisterForm onSuccess={onSuccess} />
}
