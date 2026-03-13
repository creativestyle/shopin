import { type FC } from 'react'
import { useTranslations } from 'next-intl'
import type { OrderResponse } from '@core/contracts/order/order'
import { FormattedPrice } from '@/components/ui/price/formatted-price'

interface OrderDetailSummaryProps {
  order: OrderResponse
  locale: string
}

export const OrderDetailSummary: FC<OrderDetailSummaryProps> = ({
  order,
  locale,
}) => {
  const t = useTranslations('orderHistory')

  return (
    <div className='space-y-2 border-t border-gray-200 pt-4'>
      <div className='flex justify-between text-sm'>
        <span>{t('subtotal')}</span>
        <FormattedPrice
          value={order.subtotal.regularPriceInCents}
          currency={order.currency}
          fractionDigits={order.subtotal.fractionDigits}
          locale={locale}
        />
      </div>
      {order.shippingInfo && (
        <div className='flex justify-between text-sm'>
          <span>
            {t('shippingWithMethod', {
              method: order.shippingInfo.shippingMethodName,
            })}
          </span>
          <FormattedPrice
            value={order.shippingInfo.price.regularPriceInCents}
            currency={order.currency}
            fractionDigits={order.shippingInfo.price.fractionDigits}
            locale={locale}
          />
        </div>
      )}
      {order.tax && (
        <div className='flex justify-between text-sm'>
          <span>{t('tax')}</span>
          <FormattedPrice
            value={order.tax.regularPriceInCents}
            currency={order.currency}
            fractionDigits={order.tax.fractionDigits}
            locale={locale}
          />
        </div>
      )}
      <div className='flex justify-between border-t border-gray-200 pt-2 font-semibold'>
        <span>{t('total')}</span>
        <FormattedPrice
          value={order.grandTotal.regularPriceInCents}
          currency={order.currency}
          fractionDigits={order.grandTotal.fractionDigits}
          locale={locale}
          className='font-semibold text-inherit'
        />
      </div>
    </div>
  )
}
