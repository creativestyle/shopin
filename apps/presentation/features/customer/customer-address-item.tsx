'use client'

import { Button } from '@/components/ui/button'
import { useCustomerAddressOperations } from './customer-use-customer-address-operations'
import { AddressResponse } from '@core/contracts/customer/address'
import { useTranslations } from 'next-intl'
import { FC, useId, useState } from 'react'
import PencilIcon from '@/public/icons/pencil.svg'
import TrashIcon from '@/public/icons/trash-bin.svg'
import { cn } from '@/lib/utils'
import { CustomerAddressRemovalConfirmation } from './components/customer-address-removal-confirmation'
import { CustomerAddressDefaultActions } from './customer-address-default-actions'
import { useFormatAddressLines } from '@/features/address/use-format-address-lines'
import { Card } from '@/components/ui/card'

interface CustomerAddressItemProps {
  address: AddressResponse
  isDefaultShipping: boolean
  isDefaultBilling: boolean
  onEdit: (address: AddressResponse) => void
}

export const CustomerAddressItem: FC<CustomerAddressItemProps> = ({
  address,
  isDefaultShipping,
  isDefaultBilling,
  onEdit,
}) => {
  const t = useTranslations('account.myAccount')
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const addressLabelId = useId()
  const { handleDeleteConfirm, isDeleteAddressPending } =
    useCustomerAddressOperations()

  const handleDeleteClick = () => setShowDeleteConfirmation(true)

  const onDeleteConfirm = async () => {
    if (!address.id) {
      return
    }
    await handleDeleteConfirm(address.id, () =>
      setShowDeleteConfirmation(false)
    )
  }

  const handleDeleteCancel = () => setShowDeleteConfirmation(false)

  const addressLines = useFormatAddressLines(address)

  return (
    <Card
      role='group'
      aria-labelledby={addressLabelId}
      scheme={isDefaultShipping || isDefaultBilling ? 'gray' : 'white'}
      className={cn('relative flex flex-col justify-between border', {
        'border-transparent': isDefaultShipping || isDefaultBilling,
        'border-gray-200': !isDefaultShipping && !isDefaultBilling,
      })}
    >
      {showDeleteConfirmation && (
        <CustomerAddressRemovalConfirmation
          address={address}
          onConfirm={onDeleteConfirm}
          onCancel={handleDeleteCancel}
          isDeleting={isDeleteAddressPending}
        />
      )}

      <div className='mb-4 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:justify-between sm:gap-2'>
        <div
          id={addressLabelId}
          className='space-y-1 text-sm text-gray-900'
        >
          {addressLines.map((line, index) => (
            <div
              key={index}
              className={cn({ 'text-lg font-bold': index === 0 })}
            >
              {line}
            </div>
          ))}
        </div>
        <div className='flex flex-col gap-y-2 sm:items-end sm:gap-y-1'>
          <Button
            variant='primary'
            scheme='black'
            size='sm'
            onClick={() => onEdit(address)}
            aria-label={t('addresses.edit')}
          >
            <PencilIcon className='size-4' />
            {t('addresses.edit')}
          </Button>
          <Button
            variant='secondary'
            scheme='black'
            size='sm'
            onClick={handleDeleteClick}
            aria-label={t('addresses.delete')}
            disabled={isDeleteAddressPending || showDeleteConfirmation}
          >
            <TrashIcon className='size-4' />
            {t('addresses.delete')}
          </Button>
        </div>
      </div>

      <CustomerAddressDefaultActions
        addressId={address.id}
        isDefaultShipping={isDefaultShipping}
        isDefaultBilling={isDefaultBilling}
        className='border-t border-gray-200 pt-4'
      />
    </Card>
  )
}
