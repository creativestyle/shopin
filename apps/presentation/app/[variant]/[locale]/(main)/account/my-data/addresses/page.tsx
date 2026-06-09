import { initRouteContext } from '@/lib/request-context/route-context'
import { CustomerAddresses } from '@/features/customer/customer-addresses'

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string; locale: string }>
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })

  return <CustomerAddresses />
}
