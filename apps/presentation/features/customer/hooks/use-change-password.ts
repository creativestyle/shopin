'use client'

import { addToast } from '@/components/ui/toast'
import { useBffClientMutation } from '@/lib/bff/utils/mutations'
import { useCustomerService } from './use-customer-service'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

export function useChangePassword() {
  const { customerService } = useCustomerService()
  const router = useRouter()
  const t = useTranslations('account.myAccount.changePassword')

  const changePasswordMutation = useBffClientMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      customerService.changePassword(data),
    errorMessage: t('passwordChangeError'),
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
