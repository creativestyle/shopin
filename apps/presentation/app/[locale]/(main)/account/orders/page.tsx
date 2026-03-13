import { AccountWrapper } from '@/features/account/account-wrapper'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { getTranslations } from 'next-intl/server'
import { OrderHistoryList } from '@/features/order-history/order-history-list'

export default async function Page() {
  const t = await getTranslations('account.myAccount')
  const breadcrumbs = [
    { label: t('overviewLabel'), path: '/account' },
    { label: t('ordersLabel'), path: '/account/orders' },
  ]

  return (
    <>
      <Breadcrumbs
        crumbs={breadcrumbs}
        className='max-sm:hidden'
      />
      <AccountWrapper activePage='orders'>
        <div className='space-y-4'>
          <h1 className='text-xl font-semibold'>{t('ordersLabel')}</h1>
          <OrderHistoryList />
        </div>
      </AccountWrapper>
    </>
  )
}
