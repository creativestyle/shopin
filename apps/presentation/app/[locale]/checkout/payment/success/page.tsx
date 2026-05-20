import { PaymentSuccessCallback } from '@/features/checkout/payment-success-callback'
import { StandardContainer } from '@/components/ui/standard-container'
import { getTranslations } from 'next-intl/server'

interface PaymentSuccessPageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function PaymentSuccessPage({
  params,
}: PaymentSuccessPageProps) {
  const { locale } = await params
  const t = await getTranslations('checkout')

  return (
    <StandardContainer className='flex w-full flex-1 flex-col items-center justify-center py-8 pb-16 lg:py-16'>
      <h1 className='sr-only'>{t('paymentProcessing')}</h1>
      <PaymentSuccessCallback locale={locale} />
    </StandardContainer>
  )
}
