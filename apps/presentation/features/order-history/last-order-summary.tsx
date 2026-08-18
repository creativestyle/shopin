'use client'

import { FC } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { FormattedPrice } from '@/components/ui/price/formatted-price'
import { useOrders } from './hooks/use-orders'
import { OrderStateBadge } from './components/order-state-badge'
import { LineItemImages } from './components/line-item-images'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export const LastOrderSummary: FC = () => {
  const locale = useLocale()
  const t = useTranslations('orderHistory')
  const { orders, isLoading } = useOrders({ limit: 1 })
  const order = orders[0]

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-4'>
        <LoadingSpinner className='size-6' />
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <div className='flex flex-wrap items-center gap-4 border-t border-gray-200 p-4 xl:border-t-0 xl:border-l xl:p-0 xl:pl-5'>
      <LineItemImages
        images={order.lineItemImages}
        size='sm'
      />

      <div className='grid flex-1 grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2 xl:grid-cols-3 xl:gap-y-0'>
        <div>
          <div className='text-xs font-bold text-gray-500 uppercase'>
            {t('columns.orderNumber')}
          </div>
          <span className='block text-sm break-all text-gray-700'>
            {order.orderNumber}
          </span>
        </div>

        <div>
          <div className='text-xs font-bold text-gray-500 uppercase'>
            {t('columns.date')}
          </div>
          <time
            dateTime={order.createdAt}
            className='text-sm text-gray-700'
          >
            {new Date(order.createdAt).toLocaleDateString(locale)}
          </time>
        </div>

        <div>
          <div className='text-xs font-bold text-gray-500 uppercase'>
            {t('columns.status')}
          </div>
          <OrderStateBadge state={order.orderState} />
        </div>

        <div>
          <div className='text-xs font-bold text-gray-500 uppercase'>
            {t('columns.price')}
          </div>
          <FormattedPrice
            value={order.grandTotal.regularPriceInCents}
            currency={order.currency}
            fractionDigits={order.grandTotal.fractionDigits}
            locale={locale}
            className='text-sm text-gray-700'
          />
        </div>

        {order.deliveryTime && (
          <div>
            <div className='text-xs font-bold text-gray-500 uppercase'>
              {t('deliveryTime')}
            </div>
            <span className='text-sm text-gray-700'>{order.deliveryTime}</span>
          </div>
        )}
      </div>
    </div>
  )
}
