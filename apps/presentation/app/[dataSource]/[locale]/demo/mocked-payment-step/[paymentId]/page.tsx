import { setRequestLocale } from 'next-intl/server'
import { PaymentDemo } from '@demo/mocked-payment-service-provider'
import { StandardContainer } from '@/components/ui/standard-container'

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; paymentId: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <StandardContainer className='flex w-full flex-1 flex-col items-center justify-center py-8 pb-16 lg:py-16'>
      <PaymentDemo />
    </StandardContainer>
  )
}
