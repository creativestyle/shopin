import { initRouteContext } from '@/lib/request-context/route-context'
import { CustomerData } from '@/features/customer/customer-data'
import { ChangeEmailForm } from '@/features/customer/customer-change-email-form'

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string; locale: string }>
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })

  return (
    <div className='flex flex-col gap-8'>
      <CustomerData />
      <ChangeEmailForm />
    </div>
  )
}
