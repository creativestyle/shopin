'use client'

import { useSearchParams } from 'next/navigation'
import { ForgotPasswordSuccess } from '@/features/auth/auth-forgot-password-success'

/**
 * Wraps ForgotPasswordSuccess and builds reset-password URL from page context. Page owns the URL.
 */
export function ForgotPasswordSuccessWithHref() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const params = new URLSearchParams()
  if (token) {
    params.set('token', token)
  }
  const resetPasswordHref = `/reset-password?${params.toString()}`

  return <ForgotPasswordSuccess resetPasswordHref={resetPasswordHref} />
}
