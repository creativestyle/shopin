import { getTranslations } from 'next-intl/server'
import { initRouteContext } from '@/lib/request-context/route-context'
import { AccountWrapper } from '@/features/account/account-wrapper'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { OrderHistoryDetail } from '@/features/order-history/order-history-detail'

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string; locale: string; orderId: string }>
}) {
  const { variant, locale, orderId } = await params
  initRouteContext({ variant, locale })

  const t = await getTranslations('account.myAccount')
  const breadcrumbs = [
    { label: t('overviewLabel'), path: '/account' },
    { label: t('ordersLabel'), path: '/account/orders' },
    { label: t('orderDetailLabel'), path: `/account/orders/${orderId}` },
  ]

  return (
    <>
      <h1 className='sr-only'>{t('orderDetailLabel')}</h1>
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
