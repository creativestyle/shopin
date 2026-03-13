'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useCustomerAddresses } from '@/features/customer/customer-use-customer-addresses'
import { sortAddresses } from '@/features/address/address-utils'
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
import { CustomerAddressItem } from '@/features/customer/customer-address-item'
import {
  AddressResponse,
  AddAddressRequest,
  UpdateAddressRequest,
} from '@core/contracts/customer/address'
import { useCustomerAddressOperations } from '@/features/customer/customer-use-customer-address-operations'
import { useCustomer } from '@/features/customer/customer-use-customer'
import { getAddressFormDefaultValues } from '@/features/address/address-utils'
import { AddressBase } from '@core/contracts/address/address-base'
import PlusIcon from '@/public/icons/plus.svg'
import ArrowLeftIcon from '@/public/icons/arrow-left.svg'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorDisplay } from '@/components/ui/error-display'

interface AddressStepManageAddressesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddressAdded?: (addressId: string) => void
}

type FormMode =
  | { type: 'editing'; address: AddressResponse }
  | { type: 'creating' }
  | undefined

export function AddressStepManageAddressesModal({
  open,
  onOpenChange,
  onAddressAdded,
}: AddressStepManageAddressesModalProps) {
  const t = useTranslations('account.myAccount')
  const {
    addresses,
    defaultShippingAddressId,
    defaultBillingAddressId,
    isLoading,
    error,
  } = useCustomerAddresses(true)
  const {
    handleAddAddress,
    handleUpdateAddress,
    isAddAddressPending,
    isUpdateAddressPending,
  } = useCustomerAddressOperations()
  const { customer } = useCustomer()

  const [formMode, setFormMode] = useState<FormMode>(undefined)
  const [formState, setFormState] = useState({
    isDirty: false,
  })

  const handleCreate = () => {
    setFormMode({ type: 'creating' })
  }

  const handleEdit = (address: AddressResponse) => {
    setFormMode({ type: 'editing', address })
  }

  const handleFormSubmit = async (data: AddressBase) => {
    const addressData = {
      ...data,
      // Ensure default address options are always booleans
      isDefaultShipping: data.isDefaultShipping ?? false,
      isDefaultBilling: data.isDefaultBilling ?? false,
      ...(formMode?.type === 'editing' && { id: formMode.address.id }),
    }

    if (formMode?.type === 'editing') {
      await handleUpdateAddress(addressData as UpdateAddressRequest, () =>
        setFormMode(undefined)
      )
    } else {
      await handleAddAddress(addressData as AddAddressRequest, (address) => {
        if (address.id) {
          onAddressAdded?.(address.id)
        }
        setFormMode(undefined)
      })
    }
  }

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (!isOpen) {
      setFormMode(undefined)
    }
  }

  const sortedAddresses = sortAddresses(
    addresses,
    defaultShippingAddressId,
    defaultBillingAddressId
  )

  const isPending = isAddAddressPending || isUpdateAddressPending

  return (
    <Sheet
      open={open}
      onOpenChange={handleClose}
    >
      <SheetContent
        className='w-full max-w-2xl overflow-y-auto'
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby={undefined}
      >
        <SheetHeader>
          <SheetTitle>{t('addresses.title')}</SheetTitle>
        </SheetHeader>
        {formMode && (
          <div className='border-b border-gray-200 px-4 pt-2 pb-2'>
            <Button
              variant='tertiary'
              scheme='black'
              onClick={() => setFormMode(undefined)}
              className='flex items-center gap-2'
            >
              <ArrowLeftIcon className='size-4' />
              {t('addresses.backToList')}
            </Button>
          </div>
        )}
        <SheetBody>
          {isLoading && <LoadingSpinner className='size-6' />}
          {!isLoading && error && (
            <ErrorDisplay>{t('addresses.loadError')}</ErrorDisplay>
          )}
          {!isLoading && !error && formMode && (
            <AddressForm
              key={
                formMode.type === 'editing'
                  ? formMode.address.id
                  : 'new-address'
              }
              formId='customer-address-form'
              showDefaultAddressOptions={true}
              defaultValues={getAddressFormDefaultValues(
                formMode.type === 'editing' ? formMode.address : undefined,
                customer,
                defaultShippingAddressId,
                defaultBillingAddressId
              )}
              onStateChange={setFormState}
              onSubmit={handleFormSubmit}
            />
          )}
          {!isLoading && !error && !formMode && (
            <>
              <div className='mb-4 flex justify-end'>
                <Button
                  variant='secondary'
                  onClick={handleCreate}
                  aria-label={t('addresses.addAddress')}
                >
                  <PlusIcon className='size-4' />
                  {t('addresses.addAddress')}
                </Button>
              </div>
              <div className='grid grid-cols-1 gap-4'>
                {sortedAddresses.length === 0 && (
                  <p className='text-gray-600'>{t('addresses.noAddresses')}</p>
                )}
                {sortedAddresses.length > 0 &&
                  sortedAddresses.map((address) => (
                    <CustomerAddressItem
                      key={address.id}
                      address={address}
                      isDefaultShipping={
                        address.id === defaultShippingAddressId
                      }
                      isDefaultBilling={address.id === defaultBillingAddressId}
                      onEdit={handleEdit}
                    />
                  ))}
              </div>
            </>
          )}
        </SheetBody>
        {formMode && (
          <SheetFooter>
            <Button
              type='submit'
              form='customer-address-form'
              className='w-full'
              disabled={
                isPending || (formMode.type === 'editing' && !formState.isDirty)
              }
            >
              {isPending ? t('saving') : t('save')}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
