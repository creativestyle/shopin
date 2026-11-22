'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Toast } from '@/components/ui/toast'

export const SIGN_IN_CONFIRMATION_PARAMS = {
  emailVerified: 'verified',
  passwordReset: 'resetSuccess',
} as const

type Confirmation = keyof typeof SIGN_IN_CONFIRMATION_PARAMS

/**
 * One-time success banner after email verification or password reset. Strips the flag from the URL once shown.
 */
export function SignInConfirmation() {
  const t = useTranslations('account.signIn')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)

  useEffect(() => {
    const found = (
      Object.keys(SIGN_IN_CONFIRMATION_PARAMS) as Confirmation[]
    ).find(
      (key) => searchParams.get(SIGN_IN_CONFIRMATION_PARAMS[key]) === 'true'
    )
    if (!found) {
      return
    }

    // Fill the already-mounted empty live region a frame later so it gets announced.
    const frame = requestAnimationFrame(() => {
      setConfirmation(found)

      const url = new URL(window.location.href)
      Object.values(SIGN_IN_CONFIRMATION_PARAMS).forEach((param) =>
        url.searchParams.delete(param)
      )
      router.replace(url.pathname + url.search, { scroll: false })
    })

    return () => cancelAnimationFrame(frame)
  }, [searchParams, router])

  return (
    <div className={confirmation ? 'mb-6 w-full' : 'sr-only'}>
      <Toast
        type='success'
        withCloseButton={false}
        className='max-w-full sm:max-w-full'
      >
        {confirmation ? t(confirmation) : null}
      </Toast>
    </div>
  )
}
