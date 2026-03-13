import { PaymentSuccessCallback } from '@/features/checkout/payment-success-callback'
import { StandardContainer } from '@/components/ui/standard-container'

interface PaymentSuccessPageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function PaymentSuccessPage({
  params,
}: PaymentSuccessPageProps) {
  const { locale } = await params

  return (
    <StandardContainer className='flex w-full flex-1 flex-col items-center justify-center py-8 pb-16 lg:py-16'>
      <PaymentSuccessCallback locale={locale} />
    </StandardContainer>
  )
}
