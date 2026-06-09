import { initRouteContext } from '@/lib/request-context/route-context'
import { redirect } from 'next/navigation'

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string; locale: string }>
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })

  // Server-side redirect to review page with payment failure parameter
  // The review page will show the toast
  redirect(`/${locale}/checkout/review?paymentFailed=true`)
}
