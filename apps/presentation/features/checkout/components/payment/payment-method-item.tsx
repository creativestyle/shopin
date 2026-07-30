'use client'

import type { ComponentType, SVGProps } from 'react'
import { useLocale } from 'next-intl'
import { RadioGroupItem } from '@/components/ui/radio-button'
import { cn } from '@/lib/utils'
import type { PaymentMethodResponse } from '@core/contracts/cart/payment-method'
import { PaymentInvoiceDetails } from './payment-invoice-details'
import VisaIcon from '@/public/icons/visa.svg'
import MastercardIcon from '@/public/icons/mastercard.svg'
import AmexIcon from '@/public/icons/amex.svg'
import PaypalIcon from '@/public/icons/paypal.svg'
import KlarnaIcon from '@/public/icons/klarna.svg'

type LogoComponent = ComponentType<SVGProps<SVGSVGElement>>

interface PaymentLogo {
  Icon: LogoComponent
  // Height class; defaults to 26px. Visa's wordmark reads better at 13px.
  className?: string
}

// Brand logos rendered per payment method, keyed by the method's `method` value.
const PAYMENT_METHOD_LOGOS: Record<string, PaymentLogo[]> = {
  'credit-card': [
    { Icon: AmexIcon },
    { Icon: VisaIcon, className: 'h-[13px]' },
    { Icon: MastercardIcon },
  ],
  'paypal': [{ Icon: PaypalIcon }],
  'sofort': [{ Icon: KlarnaIcon, className: 'h-4' }],
}

interface PaymentMethodItemProps {
  method: PaymentMethodResponse
  selectedMethod: string
}

export function PaymentMethodItem({
  method,
  selectedMethod,
}: PaymentMethodItemProps) {
  const locale = useLocale()

  const description = method.localizedDescription?.[locale] || method.name
  const logos = method.method ? PAYMENT_METHOD_LOGOS[method.method] : undefined
  const isSelected = selectedMethod === method.id
  const showInvoiceDetails = method.method === 'invoice' && isSelected

  return (
    <div
      className={cn(
        'flex flex-col gap-6 rounded px-4 py-6',
        isSelected ? 'border border-gray-950' : 'border border-gray-100'
      )}
    >
      <div className='flex items-center justify-between gap-3'>
        <label className='flex flex-1 cursor-pointer items-center gap-3'>
          <RadioGroupItem
            value={method.id}
            id={`payment-method-${method.id}`}
            aria-labelledby={`payment-method-${method.id}-label`}
            className='shrink-0'
          />
          <span
            id={`payment-method-${method.id}-label`}
            className='flex flex-1 flex-col gap-1'
          >
            <span className='text-sm/[1.6] text-gray-700'>{description}</span>
          </span>
        </label>
        {logos && (
          <span
            aria-hidden='true'
            className='flex shrink-0 items-center gap-1.5 lg:gap-6'
          >
            {logos.map(({ Icon, className }, index) => (
              <Icon
                key={index}
                className={cn('h-[26px] w-auto', className)}
              />
            ))}
          </span>
        )}
      </div>
      {showInvoiceDetails && <PaymentInvoiceDetails />}
    </div>
  )
}
