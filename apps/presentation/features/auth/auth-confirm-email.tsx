'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useConfirmEmail } from './hooks/use-confirm-email'
import { getConfirmEmailErrorTranslationKey } from './lib/error-translations'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { StandardContainer } from '@/components/ui/standard-container'
import { ErrorDisplay } from '@/components/ui/error-display'

interface ConfirmEmailProps {
  /** Called when email is verified (or already verified). Page is responsible for redirect/navigation. */
  onVerified?: () => void
}

export function ConfirmEmail({ onVerified }: ConfirmEmailProps) {
  const t = useTranslations('account.registrationSuccess')
  const searchParams = useSearchParams()
  const { confirmEmailMutation } = useConfirmEmail({ onVerified })
  const hasAttemptedRef = useRef(false)

  const token = searchParams.get('token')
  const signInLink = `/sign-in`

  useEffect(() => {
    if (hasAttemptedRef.current || !token) {
      return
    }

    hasAttemptedRef.current = true
    confirmEmailMutation.mutate({ tokenValue: token })

    return () => {
      hasAttemptedRef.current = false
    }
  }, [token, confirmEmailMutation])

  const isError =
    confirmEmailMutation.isError || confirmEmailMutation.data?.success === false

  let displayError: string | null = null
  if (!token) {
    displayError = t('errors.tokenRequired')
  } else if (isError) {
    const errorData = confirmEmailMutation.data
    displayError = t(
      getConfirmEmailErrorTranslationKey(errorData?.statusCode) as any
    )
  }

  return (
    <StandardContainer className='py-4 pb-16'>
      <div className='mx-auto mt-12 flex w-full max-w-md flex-col items-center px-3 sm:px-6'>
        {displayError && (
          <>
            <ErrorDisplay
              className='text-center text-base'
              centered
            >
              {displayError}
            </ErrorDisplay>
            <div className='my-4 w-full border-t border-gray-200' />
            <Link
              href={signInLink}
              className='text-center text-sm text-gray-700 underline transition-colors hover:text-gray-900'
            >
              {t('backToSignIn')}
            </Link>
          </>
        )}

        {token !== null && confirmEmailMutation.isPending && (
          <LoadingSpinner className='size-8' />
        )}
      </div>
    </StandardContainer>
  )
}
