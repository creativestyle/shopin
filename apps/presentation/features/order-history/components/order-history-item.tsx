import { FC } from 'react'
import Link from 'next/link'

import { useLocale, useTranslations } from 'next-intl'
import { FormattedPrice } from '@/components/ui/price/formatted-price'
import { type OrderSummaryResponse } from '@core/contracts/order/order'
import { Button } from '@/components/ui/button'
import ChevronRightIcon from '@/public/icons/chevronright.svg'
import { OrderStateBadge } from './order-state-badge'
import { LineItemImages } from './line-item-images'

interface OrderHistoryItemProps {
  order: OrderSummaryResponse
}

export const OrderHistoryItem: FC<OrderHistoryItemProps> = ({ order }) => {
  const locale = useLocale()
  const t = useTranslations('orderHistory')
  const formattedDate = new Date(order.createdAt).toLocaleDateString(locale)

  return (
    <div className='mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 px-4 py-4 lg:grid lg:grid-cols-[12rem_5rem_6rem_1fr_7rem] lg:items-center lg:gap-x-2 lg:gap-y-0 lg:px-2 lg:py-2 xl:grid-cols-[12rem_5rem_6rem_1fr_7rem_7rem] xl:gap-x-6 xl:px-4 xl:py-4'>
      <div className='flex items-start justify-between lg:contents'>
        <LineItemImages images={order.lineItemImages} />

        <div className='lg:order-5'>
          <OrderStateBadge state={order.orderState} />
        </div>
      </div>

      <div className='flex gap-8 lg:contents'>
        <div className='lg:order-2'>
          <div className='text-xs font-bold text-gray-500 lg:hidden'>
            {t('columns.date')}
          </div>
          <span className='text-sm'>{formattedDate}</span>
        </div>
        <div className='lg:order-4'>
          <div className='text-xs font-bold text-gray-500 lg:hidden'>
            {t('columns.price')}
          </div>
          <FormattedPrice
            value={order.grandTotal.regularPriceInCents}
            currency={order.currency}
            fractionDigits={order.grandTotal.fractionDigits}
            locale={locale}
            className='text-sm text-gray-950'
          />
        </div>
      </div>

      <div className='hidden min-w-0 lg:order-3 lg:block'>
        <span
          className='block max-w-20 truncate text-sm'
          title={order.orderNumber}
        >
          {order.orderNumber}
        </span>
      </div>

      <Button
        variant='tertiary'
        scheme='black'
        className='h-auto w-auto lg:order-6 lg:col-span-5 lg:justify-self-end xl:col-span-1'
        asChild
      >
        <Link
          href={`/account/orders/${order.id}?from=orders`}
          className='text-sm text-blue-600 hover:underline'
        >
          {t('viewOrder')}
          <ChevronRightIcon className='size-6' />
        </Link>
      </Button>
    </div>
  )
}
