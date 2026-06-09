'use client'

import { useRouter } from 'next/navigation'
import { ForgotPasswordForm } from '@/features/auth/auth-forgot-password-form'

/**
 * Renders ForgotPasswordForm and redirects on success. Page owns the redirect destination.
 */
export function ForgotPasswordFormWithRedirect() {
  const router = useRouter()

  const onSuccess = (passwordResetToken?: string) => {
    const params = new URLSearchParams()
    if (passwordResetToken) {
      params.set('token', passwordResetToken)
    }
    router.push(`/forgot-password/success?${params.toString()}`)
  }

  return <ForgotPasswordForm onSuccess={onSuccess} />
}
