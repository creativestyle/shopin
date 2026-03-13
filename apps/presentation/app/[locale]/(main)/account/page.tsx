import { AccountOverview } from '@/features/account/account-overview'
import { LastOrderSummary } from '@/features/order-history/last-order-summary'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { getTranslations } from 'next-intl/server'

export default async function Page() {
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
