'use client'

import { useTranslations } from 'next-intl'
import { FC, useState } from 'react'
import { useCustomerAddresses } from './customer-use-customer-addresses'
import {
  sortAddresses,
  cleanAddressData,
  getAddressFormDefaultValues,
} from '@/features/address/address-utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet'
import { AddressForm } from '@/features/address/address-form'
import { CustomerAddressItem } from './customer-address-item'
import {
  AddressResponse,
  UpdateAddressRequest,
} from '@core/contracts/customer/address'
import { useCustomerAddressOperations } from './customer-use-customer-address-operations'
import { useCustomer } from './customer-use-customer'
import { AddressBase } from '@core/contracts/address/address-base'
import PlusIcon from '@/public/icons/plus.svg'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorDisplay } from '@/components/ui/error-display'

export const CustomerAddresses: FC = () => {
  const t = useTranslations('account.myAccount')
  const {
    addresses,
    defaultShippingAddressId,
    defaultBillingAddressId,
    isLoading,
    error,
  } = useCustomerAddresses()
  const {
    handleAddAddress,
    handleUpdateAddress,
    isAddAddressPending,
    isUpdateAddressPending,
  } = useCustomerAddressOperations()
  const { customer } = useCustomer()
  const [open, setOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<
    AddressResponse | undefined
  >(undefined)
  const [formState, setFormState] = useState({ isDirty: false })

  const handleCreate = () => {
    setEditingAddress(undefined)
    setOpen(true)
  }

  const handleEdit = (address: AddressResponse) => {
    setEditingAddress(address)
    setOpen(true)
  }

  const handleSuccess = () => {
    setOpen(false)
    setEditingAddress(undefined)
  }

  const handleFormSubmit = async (data: AddressBase) => {
    const isEditing = !!editingAddress
    const addressData = {
      ...data,
      isDefaultShipping: data.isDefaultShipping ?? false,
      isDefaultBilling: data.isDefaultBilling ?? false,
      ...(editingAddress && { id: editingAddress.id }),
    }
    const cleanedData = cleanAddressData(addressData, isEditing)
    if (isEditing) {
      await handleUpdateAddress(
        cleanedData as UpdateAddressRequest,
        handleSuccess
      )
    } else {
      await handleAddAddress(cleanedData, handleSuccess)
    }
  }

  if (isLoading) {
    return <LoadingSpinner className='size-6' />
  }

  if (error) {
    return <ErrorDisplay>{t('addresses.loadError')}</ErrorDisplay>
  }

  const sortedAddresses = sortAddresses(
    addresses,
    defaultShippingAddressId,
    defaultBillingAddressId
  )

  return (
    <>
      <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
        {sortedAddresses.length === 0 && (
          <p className='text-gray-600'>{t('addresses.noAddresses')}</p>
        )}
        {sortedAddresses.length > 0 &&
          sortedAddresses.map((address) => (
            <CustomerAddressItem
              key={address.id}
              address={address}
              isDefaultShipping={address.id === defaultShippingAddressId}
              isDefaultBilling={address.id === defaultBillingAddressId}
              onEdit={handleEdit}
            />
          ))}
      </div>
      <div className='mt-8'>
        <Button
          variant='secondary'
          className='w-full xl:w-auto'
          onClick={handleCreate}
          aria-label={t('addresses.addAddress')}
          disabled={isLoading}
        >
          <PlusIcon className='size-5' />
          {t('addresses.addAddress')}
        </Button>
        <Sheet
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (!isOpen) {
              setEditingAddress(undefined)
            }
          }}
        >
          <SheetContent
            className='w-full max-w-xl'
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            aria-describedby={undefined}
          >
            <SheetHeader>
              <SheetTitle>
                {editingAddress
                  ? t('addresses.edit')
                  : t('addresses.addAddress')}
              </SheetTitle>
            </SheetHeader>
            <SheetBody>
              <AddressForm
                key={editingAddress?.id || 'new-address'}
                formId='customer-address-form'
                showDefaultAddressOptions={true}
                defaultValues={getAddressFormDefaultValues(
                  editingAddress,
                  customer,
                  defaultShippingAddressId,
                  defaultBillingAddressId
                )}
                onStateChange={setFormState}
                onSubmit={handleFormSubmit}
              />
            </SheetBody>
            <SheetFooter>
              <Button
                type='submit'
                form='customer-address-form'
                className='w-full'
                disabled={
                  isAddAddressPending ||
                  isUpdateAddressPending ||
                  (editingAddress && !formState.isDirty)
                }
              >
                {isAddAddressPending || isUpdateAddressPending
                  ? t('saving')
                  : t('save')}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
