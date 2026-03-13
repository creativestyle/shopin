'use client'

import { AddressStepManageAddressesModal } from '../address-step/address-step-manage-addresses-modal'

interface ShippingManageAddressesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddressAdded?: (addressId: string) => void
}

export function ShippingManageAddressesModal({
  open,
  onOpenChange,
  onAddressAdded,
}: ShippingManageAddressesModalProps) {
  return (
    <AddressStepManageAddressesModal
      open={open}
      onOpenChange={onOpenChange}
      onAddressAdded={onAddressAdded}
    />
  )
}
