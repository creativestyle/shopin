'use client'

import { type FC, type MouseEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useOrderDetail } from './hooks/use-order-detail'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorDisplay } from '@/components/ui/error-display'
import { Button } from '@/components/ui/button'
import ChevronLeftIcon from '@/public/icons/chevronleft.svg'
import { OrderDetailStatusCard } from './components/order-detail-status-card'
import { OrderDetailLineItem } from './components/order-detail-line-item'
import { OrderDetailSummary } from './components/order-detail-summary'
import { OrderDetailAddresses } from './components/order-detail-addresses'

interface OrderHistoryDetailProps {
  orderId: string
}

export const OrderHistoryDetail: FC<OrderHistoryDetailProps> = ({
  orderId,
}) => {
  const locale = useLocale()
  const t = useTranslations('orderHistory')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { order, isLoading, error } = useOrderDetail(orderId)

  const handleBack = (e: MouseEvent<HTMLAnchorElement>) => {
    if (searchParams.get('from') === 'orders' && window.history.length > 1) {
      e.preventDefault()
      router.back()
    }
  }

  if (isLoading) {
    return <LoadingSpinner className='size-6' />
  }

  if (error || !order) {
    return (
      <div className='py-4 text-center'>
        <ErrorDisplay
          centered
          className='mb-4'
        >
          {t('orderNotFound')}
        </ErrorDisplay>
        <Button
          variant='secondary'
          scheme='black'
          className='flex-1 text-center lg:flex-none'
          asChild
        >
          <Link href='/account/orders'>{t('backToOrders')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='lg:mb-4 lg:flex lg:items-center'>
        <div className='max-sm:mb-8 max-sm:w-full max-sm:justify-start max-sm:border-b max-sm:border-gray-100'>
          <Button
            variant='tertiary'
            scheme='black'
            asChild
          >
            <Link
              href='/account/orders'
              onClick={handleBack}
            >
              <ChevronLeftIcon
                className='size-6'
                aria-hidden='true'
              />
              <span className='lg:hidden'>{t('backToOrders')}</span>
            </Link>
          </Button>
        </div>

        <h2 className='mb-4 text-lg font-semibold lg:mb-0'>
          {t('orderNumber', { orderNumber: order.orderNumber })}
        </h2>
      </div>

      <OrderDetailStatusCard
        order={order}
        locale={locale}
      />

      <div className='mb-6 space-y-0'>
        <h3 className='mb-2 font-medium'>{t('items')}</h3>
        {order.lineItems.map((item) => (
          <OrderDetailLineItem
            key={item.id}
            item={item}
            currency={order.currency}
            locale={locale}
          />
        ))}
      </div>

      <OrderDetailSummary
        order={order}
        locale={locale}
      />

      <OrderDetailAddresses
        shippingAddress={order.shippingAddress}
        billingAddress={order.billingAddress}
      />
    </div>
  )
}
