import { notFound } from 'next/navigation'
import { initRouteContext } from '@/lib/request-context/route-context'
import { PaymentStep } from '@/lib/slots'
import { StandardContainer } from '@/components/ui/standard-container'
import { PageContent } from '@/components/layout/page-shell'

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string; locale: string; paymentId: string }>
}) {
  // the slot is optional: without a payment step this route does not exist
  if (!PaymentStep) {
    notFound()
  }
  const { variant, locale } = await params
  initRouteContext({ variant, locale })

  return (
    <PageContent className='flex flex-col'>
      <StandardContainer className='flex w-full flex-1 flex-col items-center justify-center py-8 pb-16 lg:py-16'>
        <PaymentStep />
      </StandardContainer>
    </PageContent>
  )
}
