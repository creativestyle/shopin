import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // Server-side redirect to review page with payment failure parameter
  // The review page will show the toast
  redirect(`/${locale}/checkout/review?paymentFailed=true`)
}
