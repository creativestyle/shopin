'use client'

import Link from 'next/link'
import CheckmarkIcon from '@/public/icons/checkmark.svg'
import PencilIcon from '@/public/icons/pencil.svg'
import { useTranslations } from 'next-intl'
import type { CheckoutStep } from './checkout-steps-config'
import { useCheckoutStepTitle } from './use-checkout-step-title'
import { BillingPreview } from '../billing/billing-preview'
import { ShippingPreview } from '../shipping/shipping-preview'
import { DeliveryMethodPreview } from '../delivery-method/delivery-method-preview'
import { PaymentPreview } from '../payment/payment-preview'
import { ReviewPreview } from '../review/review-preview'

interface CheckoutStepPreviousProps {
  step: CheckoutStep
}

// Map step IDs to their preview components
const PREVIEW_COMPONENTS: Record<string, React.ComponentType> = {
  billing: BillingPreview,
  shipping: ShippingPreview,
  deliveryMethod: DeliveryMethodPreview,
  payment: PaymentPreview,
  review: ReviewPreview,
}

export function CheckoutStepPrevious({ step }: CheckoutStepPreviousProps) {
  const t = useTranslations('checkout.complete')
  const stepTitle = useCheckoutStepTitle(step)
  const PreviewComponent = PREVIEW_COMPONENTS[step.id]

  return (
    <div className='w-full rounded-lg border border-gray-200 bg-white px-8 pt-4 pb-6 opacity-75'>
      <div className='mb-6 flex items-center justify-between gap-3'>
        <div className='flex flex-1 items-center gap-4'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700'>
            <CheckmarkIcon className='h-6 w-6' />
          </div>
          <h2 className='text-sm/[1.6] font-bold text-gray-700'>{stepTitle}</h2>
        </div>
        {step.route && (
          <Link
            href={step.route}
            scroll={false}
            className='flex shrink-0 items-center gap-1 text-sm text-gray-700 underline'
            aria-label={`${t('edit')} ${stepTitle}`}
          >
            <PencilIcon className='h-4 w-4' />
            {t('edit')}
          </Link>
        )}
      </div>
      {PreviewComponent && (
        <div className='lg:px-14'>
          <PreviewComponent />
        </div>
      )}
    </div>
  )
}
