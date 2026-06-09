import { initRouteContext } from '@/lib/request-context/route-context'
import { CheckoutComplete } from '@/features/checkout/checkout-complete'
import { StandardContainer } from '@/components/ui/standard-container'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ variant: string; locale: string }>
  searchParams: Promise<{ orderId?: string; token?: string }>
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })

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
