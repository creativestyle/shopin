'use client'

import Link from 'next/link'
import CheckmarkIcon from '@/public/icons/checkmark.svg'
import PencilIcon from '@/public/icons/pencil.svg'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useCart } from '@/features/cart/cart-use-cart'
import type { CheckoutStep, CheckoutStepId } from './checkout-steps-config'
import { useCheckoutStepTitle } from './use-checkout-step-title'
import { isStepClickable, isStepComplete } from './checkout-step-validation'
import { BillingPreview } from '../billing/billing-preview'
import { ShippingPreview } from '../shipping/shipping-preview'
import { DeliveryMethodPreview } from '../delivery-method/delivery-method-preview'
import { PaymentPreview } from '../payment/payment-preview'
import { ReviewPreview } from '../review/review-preview'

// Map step IDs to their preview components
const PREVIEW_COMPONENTS: Partial<Record<CheckoutStepId, React.ComponentType>> =
  {
    billing: BillingPreview,
    shipping: ShippingPreview,
    deliveryMethod: DeliveryMethodPreview,
    payment: PaymentPreview,
    review: ReviewPreview,
  }

interface CheckoutStepFutureProps {
  step: CheckoutStep
}

export function CheckoutStepFuture({ step }: CheckoutStepFutureProps) {
  const t = useTranslations('checkout.complete')
  const stepTitle = useCheckoutStepTitle(step)
  const { cart } = useCart()

  const isClickable = isStepClickable(step.id, cart)
  const isStepCompleted =
    step.id !== 'complete' && isStepComplete(step.id, cart)
  const PreviewComponent = PREVIEW_COMPONENTS[step.id]

  // Edit button: only visible when step is completed and clickable (card is a link, so edit is just visual)
  const editButton =
    isStepCompleted && isClickable ? (
      <div className='flex shrink-0 items-center gap-1 text-sm text-gray-700 underline'>
        <PencilIcon className='h-4 w-4' />
        {t('edit')}
      </div>
    ) : null

  const content = (
    <div
      className={cn(
        'w-full rounded-lg border border-gray-200 bg-white px-8 pt-4 pb-6',
        {
          'cursor-pointer opacity-100 transition-opacity hover:opacity-90':
            isClickable,
          'opacity-60': !isClickable,
        }
      )}
    >
      <div className='mb-6 flex items-center justify-between gap-3'>
        <div className='flex flex-1 items-center gap-4'>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-1',
              {
                'bg-gray-100 text-gray-700': isStepCompleted,
                'border-gray-400 bg-gray-50 text-gray-600':
                  !isStepCompleted && isClickable,
                'border-gray-300 bg-transparent text-gray-400':
                  !isStepCompleted && !isClickable,
              }
            )}
          >
            {isStepCompleted ? (
              <CheckmarkIcon className='h-6 w-6' />
            ) : (
              step.number
            )}
          </div>
          <h2
            className={cn('text-sm/[1.6] font-bold', {
              'text-gray-600': isClickable,
              'text-gray-400': !isClickable,
            })}
          >
            {stepTitle}
          </h2>
        </div>
        {editButton}
      </div>
      {isStepCompleted && PreviewComponent && (
        <div className='lg:px-14'>
          <PreviewComponent />
        </div>
      )}
    </div>
  )

  if (isClickable && step.route) {
    return (
      <Link
        href={step.route}
        scroll={false}
        aria-label={stepTitle}
      >
        {content}
      </Link>
    )
  }

  return content
}
