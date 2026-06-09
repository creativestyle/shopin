import { initRouteContext } from '@/lib/request-context/route-context'
import { ChangePasswordForm } from '@/features/customer/customer-change-password-form'

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string; locale: string }>
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })

  return <ChangePasswordForm />
}
