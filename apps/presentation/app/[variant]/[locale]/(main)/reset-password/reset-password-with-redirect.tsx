'use client'

import { useRouter } from 'next/navigation'
import { ResetPasswordForm } from '@/features/auth/auth-reset-password-form'

/**
 * Wraps ResetPasswordForm and performs redirect on success. Page owns the redirect destination.
 */
export function ResetPasswordWithRedirect() {
  const router = useRouter()

  const onSuccess = () => {
    router.replace('/sign-in')
  }

  return <ResetPasswordForm onSuccess={onSuccess} />
}
