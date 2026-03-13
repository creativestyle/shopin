import { type FC } from 'react'
import { useTranslations } from 'next-intl'
import type { OrderResponse } from '@core/contracts/order/order'
import { OrderStatusProgress } from './order-status-progress'

interface OrderDetailStatusCardProps {
  order: OrderResponse
  locale: string
}

export const OrderDetailStatusCard: FC<OrderDetailStatusCardProps> = ({
  order,
  locale,
}) => {
  const t = useTranslations('orderHistory')

  return (
    <div className='rounded-lg border border-gray-200 bg-gray-50 p-4 pt-3 md:p-8 md:pt-7'>
      <div className='mb-4 font-bold'>{t('orderStatus')}</div>
      <OrderStatusProgress orderState={order.orderState} />

      <div className='mt-6 grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 md:grid-cols-4'>
        <div>
          <div className='text-xs font-bold text-gray-500'>
            {t('orderDate')}
          </div>
          <div className='mt-1 text-sm'>
            {new Date(order.createdAt).toLocaleDateString(locale, {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </div>
        </div>

        {order.paymentInfo?.payments?.[0]?.paymentMethodInfo && (
          <div>
            <div className='text-xs font-bold text-gray-500'>
              {t('paymentMethod')}
            </div>
            <div className='mt-1 text-sm'>
              {order.paymentInfo.payments[0].paymentMethodInfo.name?.[locale] ??
                order.paymentInfo.payments[0].paymentMethodInfo.method ??
                t('notAvailable')}
            </div>
          </div>
        )}

        {order.shippingInfo && (
          <div>
            <div className='text-xs font-bold text-gray-500'>
              {t('shipping')}
            </div>
            <div className='mt-1 text-sm'>
              {order.shippingInfo.shippingMethodName}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
