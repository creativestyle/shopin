'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCustomerService } from './hooks/use-customer-service'
import { customerKeys } from './customer-keys'
import type {
  AddAddressRequest,
  AddressResponse,
  UpdateAddressRequest,
} from '@core/contracts/customer/address'
import { addToast } from '@/components/ui/toast'
import { useBffClientMutation } from '@/lib/bff/utils/mutations'
import { useTranslations } from 'next-intl'
import { cleanAddressData } from '@/features/address/address-utils'

/**
 * Hook for customer address mutations.
 * Provides all mutation operations for managing addresses (add, update, delete, set defaults).
 * Includes both raw mutations and wrapper functions with toast notifications.
 */
export function useCustomerAddressOperations() {
  const { customerService } = useCustomerService()
  const queryClient = useQueryClient()
  const t = useTranslations('account.myAccount')

  const addAddressMutation = useBffClientMutation({
    mutationFn: async (request: AddAddressRequest) => {
      return await customerService.addAddress(request)
    },
    errorMessage: t('addresses.addError'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.addresses() })
    },
  })

  const updateAddressMutation = useBffClientMutation({
    mutationFn: async (request: UpdateAddressRequest) => {
      return await customerService.updateAddress(request)
    },
    errorMessage: t('addresses.updateError'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.addresses() })
    },
  })

  const deleteAddressMutation = useBffClientMutation({
    mutationFn: async (addressId: string) => {
      return await customerService.deleteAddress(addressId)
    },
    errorMessage: t('addresses.deleteError'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.addresses() })
    },
  })

  const setDefaultShippingMutation = useBffClientMutation({
    mutationFn: async (addressId: string) => {
      return await customerService.setDefaultShippingAddress(addressId)
    },
    errorMessage: t('addresses.setDefaultShippingError'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.addresses() })
    },
  })

  const setDefaultBillingMutation = useBffClientMutation({
    mutationFn: async (addressId: string) => {
      return await customerService.setDefaultBillingAddress(addressId)
    },
    errorMessage: t('addresses.setDefaultBillingError'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.addresses() })
    },
  })

  const handleAddAddress = async (
    data: AddAddressRequest,
    onSuccess?: (address: AddressResponse) => void
  ): Promise<AddressResponse | undefined> => {
    const cleanData = cleanAddressData(data, false)
    const result = await addAddressMutation.mutateAsync(cleanData)
    if (result.success) {
      addToast({ type: 'success', children: t('addresses.addSuccess') })
      onSuccess?.(result.data)
      return result.data
    }
    return undefined
  }

  const handleUpdateAddress = async (
    data: UpdateAddressRequest,
    onSuccess?: () => void
  ): Promise<void> => {
    const cleanData = cleanAddressData(data, true)
    const result = await updateAddressMutation.mutateAsync({
      ...cleanData,
      id: data.id,
    })
    if (result.success) {
      addToast({ type: 'success', children: t('addresses.updateSuccess') })
      onSuccess?.()
    }
  }

  const handleDeleteConfirm = async (
    addressId: string,
    onSuccess?: () => void
  ): Promise<void> => {
    const result = await deleteAddressMutation.mutateAsync(addressId)
    if (result.success) {
      addToast({ type: 'success', children: t('addresses.deleteSuccess') })
      onSuccess?.()
    }
  }

  const handleSetDefaultShipping = async (addressId: string): Promise<void> => {
    const result = await setDefaultShippingMutation.mutateAsync(addressId)
    if (result.success) {
      addToast({
        type: 'success',
        children: t('addresses.setDefaultShippingSuccess'),
      })
    }
  }

  const handleSetDefaultBilling = async (addressId: string): Promise<void> => {
    const result = await setDefaultBillingMutation.mutateAsync(addressId)
    if (result.success) {
      addToast({
        type: 'success',
        children: t('addresses.setDefaultBillingSuccess'),
      })
    }
  }

  return {
    handleAddAddress,
    handleUpdateAddress,
    isAddAddressPending: addAddressMutation.isPending,
    isUpdateAddressPending: updateAddressMutation.isPending,
    handleDeleteConfirm,
    handleSetDefaultShipping,
    handleSetDefaultBilling,
    isDeleteAddressPending: deleteAddressMutation.isPending,
    isSetDefaultShippingPending: setDefaultShippingMutation.isPending,
    isSetDefaultBillingPending: setDefaultBillingMutation.isPending,
  }
}
