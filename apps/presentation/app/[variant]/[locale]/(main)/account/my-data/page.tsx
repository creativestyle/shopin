import { initRouteContext } from '@/lib/request-context/route-context'
import { CustomerData } from '@/features/customer/customer-data'

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string; locale: string }>
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })

  return <CustomerData />
}
