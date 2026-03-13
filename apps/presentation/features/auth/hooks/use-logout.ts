'use client'

import { addToast } from '@/components/ui/toast'
import { useBffClientMutation } from '@/lib/bff/utils/mutations'
import { useTranslations } from 'next-intl'
import { authMutationKeys } from '../auth-keys'
import { useAuthService } from './use-auth-service'

export interface UseLogoutOptions {
  /** Called after successful logout. Page is responsible for redirect/navigation. */
  onSuccess?: () => void
}

/**
 * Logout with toast. Cache invalidation (customer, cart) is handled by global MutationCache in query provider.
 * Redirect after logout is the page's responsibility (pass onSuccess).
 */
export function useLogout(options?: UseLogoutOptions) {
  const t = useTranslations('account.myAccount')
  const { authService } = useAuthService()

  const logoutMutation = useBffClientMutation({
    mutationKey: authMutationKeys.logout(),
    errorMessage: t('logoutError'),
    mutationFn: async (): Promise<void> => {
      return await authService.logout()
    },
  })

  const handleLogout = async () => {
    if (logoutMutation.isPending) {
      return
    }
    const result = await logoutMutation.mutateAsync(undefined)
    if (result.success) {
      addToast({
        type: 'success',
        children: t('logoutSuccess'),
      })
      options?.onSuccess?.()
    }
  }

  return {
    handleLogout,
    isLoggingOut: logoutMutation.isPending,
  }
}
