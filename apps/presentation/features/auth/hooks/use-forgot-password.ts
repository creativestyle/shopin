'use client'

import { useBffClientMutation } from '@/lib/bff/utils/mutations'
import { useAuthService } from './use-auth-service'
import { authMutationKeys } from '../auth-keys'
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
} from '@core/contracts/auth/forgot-password'

/**
 * Forgot password mutation. Generates a password reset token.
 */
export function useForgotPassword() {
  const { authService } = useAuthService()

  const forgotPasswordMutation = useBffClientMutation({
    mutationKey: authMutationKeys.forgotPassword(),
    mutationFn: async (
      request: ForgotPasswordRequest
    ): Promise<ForgotPasswordResponse> => {
      return await authService.forgotPassword(request)
    },
  })

  return { forgotPasswordMutation }
}
