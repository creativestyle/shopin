'use client'

import { addToast } from '@/components/ui/toast'
import {
  useBffClientMutation,
  useMutationErrorHandler,
} from '@/lib/bff/utils/mutations'
import { useCustomerService } from './use-customer-service'
import { InvalidCurrentPasswordError } from '../lib/invalid-current-password-error'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/navigation'

export function useChangePassword() {
  const { customerService } = useCustomerService()
  const router = useRouter()
  const t = useTranslations('account.myAccount.changePassword')
  const handleError = useMutationErrorHandler()

  const changePasswordMutation = useBffClientMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      customerService.changePassword(data),
    // A wrong current password is shown on the field by the form, not as a toast.
    errorMessage: null,
    onError: (error) => {
      if (error instanceof InvalidCurrentPasswordError) {
        return
      }
      handleError(error, t('passwordChangeError'))
    },
    onSuccess: () => {
      addToast({
        type: 'success',
        children: t('passwordChangeSuccess'),
      })
      router.push(`/sign-in`)
    },
  })

  return {
    handlePasswordChange: changePasswordMutation.mutateAsync,
    isPasswordChangePending: changePasswordMutation.isPending,
  }
}
