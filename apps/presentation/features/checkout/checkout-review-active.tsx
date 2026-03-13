'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError } from '@/components/ui/field'
import { useCart } from '@/features/cart/cart-use-cart'
import { useInitiatePayment } from './hooks/use-initiate-payment'
import { addToast } from '@/components/ui/toast'

export function ReviewActive() {
  const t = useTranslations('checkout.steps.review')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { cart } = useCart()
  const { handleInitiatePayment, isPending } = useInitiatePayment()
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [hasError, setHasError] = useState(false)
  const hasShownToastRef = useRef(false)

  useEffect(() => {
    if (hasShownToastRef.current) {
      return
    }

    const paymentFailedParam = searchParams?.get('paymentFailed')
    if (paymentFailedParam === 'true') {
      hasShownToastRef.current = true

      addToast({
        type: 'error',
        children: t('paymentFailure', {
          default: 'Payment failed. Please try again.',
        }),
      })

      const params = new URLSearchParams(searchParams?.toString())
      params.delete('paymentFailed')
      const queryString = params.toString()
      router.replace(queryString ? `${pathname}?${queryString}` : pathname)
    }
  }, [searchParams, router, pathname, t])

  const handlePlaceOrder = async () => {
    if (!termsAccepted) {
      setHasError(true)
      return
    }

    if (!cart?.id) {
      addToast({
        type: 'error',
        children: t('noCartError', {
          default: 'No cart found. Please try again.',
        }),
      })
      return
    }

    setHasError(false)

    const result = await handleInitiatePayment(cart.id)
    if (result?.paymentLink) {
      window.location.href = result.paymentLink
    }
  }

  const handleTermsChange = (checked: boolean) => {
    setTermsAccepted(checked === true)
    if (checked && hasError) {
      setHasError(false)
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      <Field data-invalid={hasError}>
        <div className='flex items-start gap-3'>
          <Checkbox
            id='accept-terms'
            checked={termsAccepted}
            onCheckedChange={handleTermsChange}
            invalid={hasError}
            className='mt-0.5 shrink-0'
          />
          <label
            htmlFor='accept-terms'
            className='flex-1 cursor-pointer text-sm/[1.6] text-gray-700'
          >
            {t('acceptTerms')}
          </label>
        </div>
        {hasError && (
          <FieldError
            error={{ message: 'checkout.steps.review.termsRequired' }}
            variant='checkbox'
          />
        )}
      </Field>
      <div className='mt-6 flex justify-end'>
        <Button
          variant='primary'
          scheme='red'
          onClick={handlePlaceOrder}
          className='w-full'
          disabled={isPending}
        >
          {isPending
            ? t('processing', { default: 'Processing...' })
            : t('buyNow')}
        </Button>
      </div>
    </div>
  )
}
