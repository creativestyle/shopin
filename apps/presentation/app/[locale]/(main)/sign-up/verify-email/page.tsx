import { Suspense } from 'react'
import { VerifyEmailWithRedirect } from './verify-email-with-redirect'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { getTranslations } from 'next-intl/server'

export default async function VerifyEmailRoute() {
  const t = await getTranslations('account.registrationSuccess')

  return (
    <>
      <h1 className='sr-only'>{t('confirmButton')}</h1>
      <Suspense fallback={<LoadingSpinner className='size-8' />}>
        <VerifyEmailWithRedirect />
      </Suspense>
    </>
  )
}
