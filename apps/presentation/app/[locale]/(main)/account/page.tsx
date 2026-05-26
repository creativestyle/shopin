import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AccountOverview } from '@/features/account/account-overview'
import { LastOrderSummary } from '@/features/order-history/last-order-summary'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

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
