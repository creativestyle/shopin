import { type FC } from 'react'
import { useTranslations } from 'next-intl'
import type { OrderResponse } from '@core/contracts/order/order'

interface OrderDetailAddressesProps {
  shippingAddress: OrderResponse['shippingAddress']
  billingAddress: OrderResponse['billingAddress']
}

export const OrderDetailAddresses: FC<OrderDetailAddressesProps> = ({
  shippingAddress,
  billingAddress,
}) => {
  const t = useTranslations('orderHistory')

  if (!shippingAddress && !billingAddress) {
    return null
  }

  return (
    <div className='mt-6 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 md:grid-cols-2'>
      {shippingAddress && (
        <div>
          <h3 className='mb-2 font-medium'>{t('shippingAddress')}</h3>
          <div className='text-sm text-gray-600'>
            <p>
              {shippingAddress.firstName} {shippingAddress.lastName}
            </p>
            <p>
              {shippingAddress.streetName} {shippingAddress.streetNumber}
            </p>
            <p>
              {shippingAddress.postalCode} {shippingAddress.city}
            </p>
            <p>{shippingAddress.country}</p>
          </div>
        </div>
      )}
      {billingAddress && (
        <div>
          <h3 className='mb-2 font-medium'>{t('billingAddress')}</h3>
          <div className='text-sm text-gray-600'>
            <p>
              {billingAddress.firstName} {billingAddress.lastName}
            </p>
            <p>
              {billingAddress.streetName} {billingAddress.streetNumber}
            </p>
            <p>
              {billingAddress.postalCode} {billingAddress.city}
            </p>
            <p>{billingAddress.country}</p>
          </div>
        </div>
      )}
    </div>
  )
}
