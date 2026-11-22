'use client'

import { addToast } from '@/components/ui/toast'
import {
  useBffClientMutation,
  useMutationErrorHandler,
} from '@/lib/bff/utils/mutations'
import { useCustomerService } from './use-customer-service'
import { customerKeys } from '../customer-keys'
import { InvalidCurrentPasswordError } from '../lib/invalid-current-password-error'
import { EmailInUseError } from '../lib/email-in-use-error'
import { EmailUnchangedError } from '../lib/email-unchanged-error'
import { ChangeCustomerEmailRequest } from '@core/contracts/customer/customer'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

export function useChangeEmail() {
  const { customerService } = useCustomerService()
  const queryClient = useQueryClient()
  const t = useTranslations('account.myAccount.changeEmail')
  const handleError = useMutationErrorHandler()

  const changeEmailMutation = useBffClientMutation({
    mutationFn: (data: ChangeCustomerEmailRequest) =>
      customerService.changeEmail(data),
    // Field-level failures are shown on the fields by the form, not as a toast.
    errorMessage: null,
    onError: (error) => {
      if (
        error instanceof InvalidCurrentPasswordError ||
        error instanceof EmailInUseError ||
        error instanceof EmailUnchangedError
      ) {
        return
      }
      handleError(error, t('changeEmailError'))
    },
    onSuccess: ({ customer }) => {
      queryClient.setQueryData(customerKeys.me(), customer)
      addToast({
        type: 'success',
        children: t('changeEmailSuccess'),
      })
    },
  })

  return {
    handleEmailChange: changeEmailMutation.mutateAsync,
    isEmailChangePending: changeEmailMutation.isPending,
  }
}
