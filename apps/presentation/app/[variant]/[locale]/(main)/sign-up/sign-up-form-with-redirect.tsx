'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/lib/navigation'
import { RegisterForm } from '@/features/auth/auth-register-form'
import { setReturnToFromSearchParams } from '@/lib/return-to'
import { markRegistrationCompleted } from '@/features/auth/auth-registration-flag'

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
    setReturnToFromSearchParams(params, searchParams)
    markRegistrationCompleted()
    router.push(`/sign-up/success?${params.toString()}`)
  }

  return <RegisterForm onSuccess={onSuccess} />
}
