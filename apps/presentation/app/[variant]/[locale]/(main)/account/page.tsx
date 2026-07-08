import { getTranslations } from 'next-intl/server'
import { initRouteContext } from '@/lib/request-context/route-context'
import { AccountOverview } from '@/features/account/account-overview'
import { LastOrderSummary } from '@/features/order-history/last-order-summary'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string; locale: string }>
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })

  const t = await getTranslations('account.myAccount')

  const breadcrumbs = [{ label: t('overviewLabel'), path: '/account' }]

  return (
    <>
      <Breadcrumbs
        crumbs={breadcrumbs}
        className='max-sm:hidden'
      />
      <AccountOverview orderSlot={<LastOrderSummary />} />
    </>
  )
}
