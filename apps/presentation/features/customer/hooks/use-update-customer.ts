'use client'

import { addToast } from '@/components/ui/toast'
import {
  useBffClientMutation,
  useMutationErrorHandler,
} from '@/lib/bff/utils/mutations'
import { useCustomerService } from './use-customer-service'
import { customerKeys } from '../customer-keys'
import { HttpError } from '@/lib/error-utils'
import { UpdateCustomerRequest } from '@core/contracts/customer/customer'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

interface UseUpdateCustomerOptions {
  onSuccess: () => void
}

export function useUpdateCustomer({ onSuccess }: UseUpdateCustomerOptions) {
  const { customerService } = useCustomerService()
  const queryClient = useQueryClient()
  const handleError = useMutationErrorHandler()
  const t = useTranslations('account.myAccount.customerData')

  const updateCustomerMutation = useBffClientMutation({
    mutationFn: (data: UpdateCustomerRequest) =>
      customerService.updateCustomer(data),
    // A taken email (409) is shown on the field by the form, not as a toast.
    errorMessage: null,
    onError: (error) => {
      if (HttpError.isConflictError(error)) {
        return
      }
      handleError(error, t('errors.general'))
    },
    onSuccess: (data) => {
      queryClient.setQueryData(customerKeys.me(), data)
      addToast({
        type: 'success',
        children: t('updateSuccess'),
      })
      onSuccess()
    },
  })

  return {
    updateCustomer: updateCustomerMutation.mutateAsync,
    isUpdateCustomerPending: updateCustomerMutation.isPending,
  }
}
