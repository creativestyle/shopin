'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'

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
        <Toast
          type='warning'
          withCloseButton={false}
        >
          Button and link are temporary until email service provider is set up
        </Toast>
        <Button
          asChild
          variant='primary'
          scheme='red'
          className='w-full uppercase'
        >
          <Link href={verifyEmailHref}>{t('confirmButton')}</Link>
        </Button>
      </div>
    </div>
  )
}
