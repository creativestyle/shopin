import { setRequestLocale } from 'next-intl/server'
import { CheckoutComplete } from '@/features/checkout/checkout-complete'
import { StandardContainer } from '@/components/ui/standard-container'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ orderId?: string; token?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const { orderId, token } = await searchParams

  return (
    <StandardContainer className='w-full py-8'>
      <CheckoutComplete
        orderId={orderId}
        token={token}
      />
    </StandardContainer>
  )
}
