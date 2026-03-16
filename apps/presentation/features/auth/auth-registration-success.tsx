'use client'

import { useTranslations } from 'next-intl'
// TODO: Remove once email service provider is configured.
import { TemporaryVerifyEmailButton } from './auth-temporary-verify-email-button'

interface RegistrationSuccessProps {
  /** Verify-email link. Page is responsible for building the URL. */
  verifyEmailHref: string
}

export function RegistrationSuccess({
  verifyEmailHref,
}: RegistrationSuccessProps) {
  const t = useTranslations('account.registrationSuccess')

  return (
    <div className='flex w-full flex-col content-stretch gap-6'>
      <div className='flex w-full flex-col gap-4'>
        <h2 className='text-xl font-normal text-gray-950'>{t('title')}</h2>
        <p className='text-base text-gray-700'>{t('description')}</p>
      </div>

      <div className='flex w-full flex-col gap-4'>
        <TemporaryVerifyEmailButton
          href={verifyEmailHref}
          label={t('confirmButton')}
        />
      </div>
    </div>
  )
}
