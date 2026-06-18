import { getTranslations } from 'next-intl/server'
import { initRouteContext } from '@/lib/request-context/route-context'
import { PaymentSuccessCallback } from '@/features/checkout/payment-success-callback'
import { StandardContainer } from '@/components/ui/standard-container'

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string; locale: string }>
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })

  const t = await getTranslations('checkout')

  return (
    <StandardContainer className='flex w-full flex-1 flex-col items-center justify-center py-8 pb-16 lg:py-16'>
      <h1 className='sr-only'>{t('paymentProcessing')}</h1>
      <PaymentSuccessCallback />
    </StandardContainer>
  )
}
