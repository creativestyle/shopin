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
      <div className='hidden lg:flex lg:items-center lg:justify-center'>
        <LoadingSpinner className='size-6' />
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <div className='hidden items-center gap-6 border-l border-gray-200 px-7 lg:flex'>
      <LineItemImages
        images={order.lineItemImages}
        size='sm'
      />

      <div className='flex items-center gap-4 lg:gap-8'>
        <div>
          <div className='text-xs font-bold text-gray-500 uppercase'>
            {t('lastOrder')}
          </div>
          <FormattedPrice
            value={order.grandTotal.regularPriceInCents}
            currency={order.currency}
            fractionDigits={order.grandTotal.fractionDigits}
            locale={locale}
            className='text-sm text-gray-700'
          />
        </div>

        <div>
          <div className='text-xs font-bold text-gray-500 uppercase'>
            {t('columns.status')}
          </div>
          <OrderStateBadge state={order.orderState} />
        </div>

        <div>
          <div className='text-xs font-bold text-gray-500 uppercase'>
            {t('deliveryTime')}
          </div>
          <span className='text-sm text-gray-700'>
            {t('deliveryTimeValue')}
          </span>
        </div>
      </div>
    </div>
  )
}
