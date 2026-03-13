'use client'

import { AddressStepManageAddressesModal } from '../address-step/address-step-manage-addresses-modal'

interface BillingManageAddressesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddressAdded?: (addressId: string) => void
}

export function BillingManageAddressesModal({
  open,
  onOpenChange,
  onAddressAdded,
}: BillingManageAddressesModalProps) {
  return (
    <AddressStepManageAddressesModal
      open={open}
      onOpenChange={onOpenChange}
      onAddressAdded={onAddressAdded}
    />
  )
}
