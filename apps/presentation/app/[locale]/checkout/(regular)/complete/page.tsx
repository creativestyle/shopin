import { CheckoutComplete } from '@/features/checkout/checkout-complete'
import { StandardContainer } from '@/components/ui/standard-container'

interface CheckoutCompletePageProps {
  searchParams: Promise<{
    orderId?: string
    token?: string
  }>
}

export default async function CheckoutCompletePage({
  searchParams,
}: CheckoutCompletePageProps) {
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
