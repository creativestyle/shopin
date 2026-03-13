import { type FC } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { OrderResponse } from '@core/contracts/order/order'
import { FormattedPrice } from '@/components/ui/price/formatted-price'

interface OrderDetailLineItemProps {
  item: OrderResponse['lineItems'][number]
  currency: string
  locale: string
}

export const OrderDetailLineItem: FC<OrderDetailLineItemProps> = ({
  item,
  currency,
  locale,
}) => {
  const t = useTranslations('orderHistory')

  return (
    <div className='flex gap-4 border-b border-gray-200 py-6 first:pt-0 last:border-0'>
      {item.imageUrl ? (
        <div className='relative h-28 w-28 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50'>
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className='object-contain'
            sizes='112px'
          />
        </div>
      ) : (
        <div className='h-28 w-28 shrink-0 rounded border border-gray-200 bg-gray-100' />
      )}

      <div className='flex flex-1 flex-col justify-between'>
        <div>
          <div className='text-sm font-bold'>{item.name}</div>
          {item.sku && (
            <div className='mt-0.5 text-xs text-gray-500'>
              {t('artNrLabel', { sku: item.sku })}
            </div>
          )}
          {item.attributes && Object.keys(item.attributes).length > 0 && (
            <div className='mt-2 space-y-0.5'>
              {Object.entries(item.attributes).map(([key, value]) => (
                <div
                  key={key}
                  className='text-sm text-gray-600'
                >
                  <span className='capitalize'>{key}</span>: {value}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className='flex shrink-0 flex-col items-end justify-between'>
        <div className='text-sm text-gray-500'>
          {t('qtyLabel')}{' '}
          <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-700'>
            {item.quantity}
          </span>
        </div>
        <div className='text-right'>
          {item.price.discountedPriceInCents != null && (
            <FormattedPrice
              value={item.price.regularPriceInCents}
              currency={currency}
              fractionDigits={item.price.fractionDigits}
              locale={locale}
              className='text-sm text-gray-400 line-through'
            />
          )}
          <FormattedPrice
            value={
              item.price.discountedPriceInCents ??
              item.price.regularPriceInCents
            }
            currency={currency}
            fractionDigits={item.price.fractionDigits}
            locale={locale}
            className={
              item.price.discountedPriceInCents != null
                ? 'text-sm font-bold text-red-600'
                : 'text-sm font-bold text-inherit'
            }
          />
        </div>
      </div>
    </div>
  )
}
