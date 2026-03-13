import { redirect } from 'next/navigation'

interface PaymentFailurePageProps {
  params: Promise<{
    locale: string
  }>
  searchParams: Promise<{
    paymentId?: string
  }>
}

export default async function PaymentFailurePage({
  params,
}: PaymentFailurePageProps) {
  const { locale } = await params

  // Server-side redirect to review page with payment failure parameter
  // The review page will show the toast
  redirect(`/${locale}/checkout/review?paymentFailed=true`)
}
