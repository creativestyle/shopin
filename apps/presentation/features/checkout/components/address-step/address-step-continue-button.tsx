'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { getNextStep } from '../checkout-steps-frame/checkout-steps-config'
import { useCheckoutButtonLabel } from '../checkout-steps-frame/use-checkout-button-label'
import type { AddressType } from '@core/contracts/address/address-base'

interface AddressStepContinueButtonProps {
  stepId: AddressType
  addressType: AddressType
  /**
   * Whether the button is in a pending/loading state
   */
  isPending: boolean
  /**
   * Whether the button should be disabled (e.g., when no address is selected)
   */
  disabled?: boolean
  /**
   * Form ID if this button should submit a form (for form submission)
   */
  formId?: string
  /**
   * Click handler if this is a regular button (for address book selection)
   */
  onClick?: () => void
}

export function AddressStepContinueButton({
  stepId,
  addressType,
  isPending,
  disabled = false,
  formId,
  onClick,
}: AddressStepContinueButtonProps) {
  const tCheckout = useTranslations('checkout')
  const nextStep = getNextStep(stepId)
  const hasFutureSteps = nextStep !== null
  const buttonLabel = useCheckoutButtonLabel(stepId)

  if (!hasFutureSteps) {
    return null
  }

  return (
    <div className='mt-6 flex justify-end'>
      <Button
        type={formId ? 'submit' : 'button'}
        form={formId}
        onClick={onClick}
        variant='primary'
        scheme='red'
        className='w-full'
        disabled={disabled || isPending}
      >
        {isPending ? tCheckout(`${addressType}.saving`) : buttonLabel}
      </Button>
    </div>
  )
}
