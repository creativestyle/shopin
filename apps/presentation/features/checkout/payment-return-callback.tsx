'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from '@/lib/navigation'
import { useSearchParams } from 'next/navigation'
import { useCompletePaymentReturn } from './hooks/use-complete-payment-return'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useTranslations } from 'next-intl'
import { Toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'

/** What the payment provider sent back to the return route: the payment id and its own parameters, as they came. */
function returnRequest(search: URLSearchParams | null) {
  const params = Object.fromEntries(search?.entries() ?? [])
  const { paymentId = '', ...rest } = params
  return { paymentId, params: rest }
}

/**
 * The shop's one payment return route: asks the BFF for the payment's result once, which creates the order only
 * for a paid or authorized payment (a confirmation), else sends the shopper back to pay again.
 */
export function PaymentReturnCallback() {
  const router = useRouter()
  const t = useTranslations('checkout')
  const search = useSearchParams()
  const attemptedRef = useRef(false)

  const { completePaymentReturn, error, isPending } = useCompletePaymentReturn()
  const request = returnRequest(search)

  useEffect(() => {
    if (attemptedRef.current) {
      return
    }
    attemptedRef.current = true
    if (!request.paymentId) {
      router.push('/checkout/review?paymentFailed=true')
      return
    }
    completePaymentReturn(request)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Show error state with retry button
  if (error) {
    return (
      <div className='flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4'>
        <Toast
          type='error'
          withCloseButton={false}
          className='w-full max-w-2xl'
        >
          <p className='font-semibold'>{t('orderCreationError')}</p>
        </Toast>
        <div className='flex gap-4'>
          <Button
            variant='primary'
            scheme='red'
            onClick={() => completePaymentReturn(request)}
            disabled={isPending}
          >
            {isPending ? t('processingOrder') : t('retry')}
          </Button>
          <Button
            variant='secondary'
            scheme='black'
            onClick={() => router.push('/checkout/review')}
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
