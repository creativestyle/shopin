'use client'

import { useBffClientMutation } from '@/lib/bff/utils/mutations'
import { useAuthService } from './use-auth-service'
import { authMutationKeys } from '../auth-keys'
import type {
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '@core/contracts/auth/reset-password'

/**
 * Reset password mutation. Resets password using a token.
 */
export function useResetPassword() {
  const { authService } = useAuthService()

  const resetPasswordMutation = useBffClientMutation({
    mutationKey: authMutationKeys.resetPassword(),
    mutationFn: async (
      request: ResetPasswordRequest
    ): Promise<ResetPasswordResponse> => {
      return await authService.resetPassword(request)
    },
  })

  return { resetPasswordMutation }
}
