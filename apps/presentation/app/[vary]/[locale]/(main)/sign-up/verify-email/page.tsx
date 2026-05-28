import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { VerifyEmailWithRedirect } from './verify-email-with-redirect'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
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
