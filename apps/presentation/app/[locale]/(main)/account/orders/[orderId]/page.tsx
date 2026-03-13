import { AccountWrapper } from '@/features/account/account-wrapper'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { getTranslations } from 'next-intl/server'
import { OrderHistoryDetail } from '@/features/order-history/order-history-detail'

interface PageProps {
  params: Promise<{ orderId: string }>
}

export default async function Page({ params }: PageProps) {
  const { orderId } = await params
  const t = await getTranslations('account.myAccount')
  const breadcrumbs = [
    { label: t('overviewLabel'), path: '/account' },
    { label: t('ordersLabel'), path: '/account/orders' },
    { label: t('orderDetailLabel'), path: `/account/orders/${orderId}` },
  ]

  return (
    <>
      <Breadcrumbs
        crumbs={breadcrumbs}
        className='max-sm:hidden'
      />
      <AccountWrapper
        activePage='orders'
        hideBackButton
      >
        <div className='space-y-4'>
          <OrderHistoryDetail orderId={orderId} />
        </div>
      </AccountWrapper>
    </>
  )
}
