import { getTranslations } from 'next-intl/server'
import { initRouteContext } from '@/lib/request-context/route-context'
import { Suspense } from 'react'
import { VerifyEmailWithRedirect } from './verify-email-with-redirect'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string; locale: string }>
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })
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
