'use client'

import { AddressStepContinueButton } from '../address-step/address-step-continue-button'

interface ShippingContinueButtonProps {
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

export function ShippingContinueButton({
  isPending,
  disabled = false,
  formId,
  onClick,
}: ShippingContinueButtonProps) {
  return (
    <AddressStepContinueButton
      stepId='shipping'
      addressType='shipping'
      isPending={isPending}
      disabled={disabled}
      formId={formId}
      onClick={onClick}
    />
  )
}
