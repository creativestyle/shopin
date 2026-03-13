'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateCheckoutOrder } from './hooks/use-create-checkout-order'
import { useCart } from '@/features/cart/cart-use-cart'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useTranslations } from 'next-intl'
import { Toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/error-utils'

interface PaymentSuccessCallbackProps {
  locale: string
}

export function PaymentSuccessCallback({
  locale,
}: PaymentSuccessCallbackProps) {
  const router = useRouter()
  const t = useTranslations('checkout')
  const { cart } = useCart()
  const attemptedCartIdRef = useRef<string | null>(null)

  const { createOrder, error, isPending } = useCreateCheckoutOrder({
    locale,
  })

  useEffect(() => {
    // Only attempt once per cart - if cart changes, retry with new cart
    if (!cart?.id) {
      return
    }

    if (attemptedCartIdRef.current === cart.id) {
      return
    }

    attemptedCartIdRef.current = cart.id
    createOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.id])

  // Show error state with retry button
  if (error) {
    return (
      <div className='flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4'>
        <Toast
          type='error'
          withCloseButton={false}
          className='w-full max-w-2xl'
        >
          <div className='flex flex-col gap-2'>
            <p className='font-semibold'>{t('orderCreationError')}</p>
            <p className='text-sm'>
              {getErrorMessage(error, t('orderCreationError'))}
            </p>
          </div>
        </Toast>
        <div className='flex gap-4'>
          <Button
            variant='primary'
            scheme='red'
            onClick={() => {
              attemptedCartIdRef.current = null
              createOrder()
            }}
            disabled={isPending}
          >
            {isPending ? t('processingOrder') : t('retry')}
          </Button>
          <Button
            variant='secondary'
            scheme='black'
            onClick={() => router.push(`/${locale}/checkout/review`)}
          >
            {t('backToCart')}
          </Button>
        </div>
      </div>
    )
  }

  // Show loading state
  return (
    <div className='flex flex-col items-center gap-4'>
      <LoadingSpinner className='size-8' />
      <p className='text-sm text-gray-600'>
        {t('processingOrder', {
          default: 'Processing your order...',
        })}
      </p>
    </div>
  )
}
