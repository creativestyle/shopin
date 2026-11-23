'use client'

import { useRouter } from '@/lib/navigation'
import { ResetPasswordForm } from '@/features/auth/auth-reset-password-form'
import { SIGN_IN_CONFIRMATION_PARAMS } from '@/features/auth/auth-sign-in-confirmation'

/**
 * Wraps ResetPasswordForm and performs redirect on success. Page owns the redirect destination.
 */
export function ResetPasswordWithRedirect() {
  const router = useRouter()

  const onSuccess = () => {
    router.replace(`/sign-in?${SIGN_IN_CONFIRMATION_PARAMS.passwordReset}=true`)
  }

  return <ResetPasswordForm onSuccess={onSuccess} />
}
