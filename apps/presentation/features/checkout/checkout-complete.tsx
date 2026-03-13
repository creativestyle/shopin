'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useCheckoutCompleteOrder } from './hooks/use-checkout-complete-order'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CartPreview } from '@/features/cart/cart-preview'
import { useFormatAddressLines } from '@/features/address/use-format-address-lines'
import { getPaymentMethodName } from './lib/payment-utils'
import { ErrorDisplay } from '@/components/ui/error-display'
import CheckmarkIcon from '@/public/icons/checkmark.svg'

interface CheckoutCompleteProps {
  orderId?: string
  token?: string
}

export function CheckoutComplete({ orderId, token }: CheckoutCompleteProps) {
  const t = useTranslations('checkout.complete')
  const tAll = useTranslations()
  const locale = useLocale()
  const { order, isLoading, error, isValid } = useCheckoutCompleteOrder({
    orderId,
    token,
  })

  // Extract payment method name from saved payment (with locale)
  // This uses the localized name that was saved when the payment was set
  // Falls back to translated "unknown!" if not resolved
  const paymentMethodNameRaw = order?.paymentInfo
    ? getPaymentMethodName(order.paymentInfo, locale)
    : null
  const paymentMethodName = paymentMethodNameRaw || t('paymentMethod')

  // Format shipping address
  const shippingAddressLines = useFormatAddressLines(order?.shippingAddress)

  // Show loading state while validating security checks or loading order
  if (!isValid || isLoading) {
    return (
      <div className='flex min-h-[70vh] flex-col items-center justify-center'>
        <LoadingSpinner className='size-8' />
        <p className='mt-4 text-sm text-gray-600'>{tAll('common.loading')}</p>
      </div>
    )
  }

  // Show error state for entire component
  if (error || !order) {
    return (
      <div className='flex min-h-[70vh] flex-col items-center justify-center'>
        <ErrorDisplay centered>{t('loadError')}</ErrorDisplay>
      </div>
    )
  }

  return (
    <div className='flex flex-col items-center'>
      {/* Checkmark Icon */}
      <div className='mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-white'>
        <CheckmarkIcon className='h-8 w-8 text-gray-700' />
      </div>

      {/* Thank You Message */}
      <h1 className='mb-4 text-center text-2xl font-bold text-gray-950'>
        {t('thankYou')}
      </h1>

      {/* Order Confirmation Text */}
      <p className='mb-8 text-center text-sm text-gray-600'>
        {t('confirmationMessage', {
          orderNumber: order.orderNumber,
          email: order.email || '',
        })}
      </p>

      {/* Order Details - Two Column Layout */}
      <div className='grid w-full grid-cols-1 gap-8 lg:grid-cols-[5fr_3fr]'>
        {/* Left Column - Shipping and Payment Information */}
        <div className='w-full rounded-lg border border-gray-200 bg-white p-6'>
          <h2 className='mb-6 text-lg/[1.1] font-bold text-gray-950'>
            {t('orderDetails')}
          </h2>
          <div className='space-y-4 text-sm text-gray-700'>
            <div>
              <p className='font-semibold'>
                {t('orderNumber', { orderNumber: order.orderNumber })}
              </p>
            </div>
            <div>
              <p className='text-green-600'>{t('deliveryTime')}</p>
            </div>
            <div>
              <p className='mb-2 font-semibold'>{t('delivery')}</p>
              {shippingAddressLines.length > 0 ? (
                <div className='space-y-1 text-gray-600'>
                  {shippingAddressLines.map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              ) : (
                <p className='text-gray-600'>
                  {t('deliveryAddress', {
                    name: '',
                    address: '',
                    city: '',
                    country: '',
                  })}
                </p>
              )}
            </div>
            <div>
              <p className='mb-2 font-semibold'>{t('deliveryMethod')}</p>
              <p className='text-gray-600'>
                {order.shippingInfo?.shippingMethodName ||
                  t('deliveryMethodDetails')}
              </p>
            </div>
            <div>
              <p className='mb-2 font-semibold'>{t('payment')}</p>
              <p className='text-gray-600'>{paymentMethodName}</p>
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className='lg:sticky lg:top-8 lg:h-fit'>
          <div className='w-full rounded-lg border border-gray-200 bg-white p-6 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto'>
            <h2 className='mb-6 text-lg/[1.1] font-bold text-gray-950'>
              {t('orderSummary')}
            </h2>
            <CartPreview
              cart={order}
              showPromoCode={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
