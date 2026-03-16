'use client'

import { useBffClientMutation } from '@/lib/bff/utils/mutations'
import { authMutationKeys } from '../auth-keys'
import { useAuthService } from './use-auth-service'
import type {
  ResendVerificationEmailRequest,
  ResendVerificationEmailResponse,
} from '@core/contracts/auth/resend-verification-email'

export function useResendVerificationEmail() {
  const { authService } = useAuthService()

  const resendVerificationEmailMutation = useBffClientMutation({
    mutationKey: authMutationKeys.resendVerificationEmail(),
    // null = no automatic toast; caller handles feedback
    errorMessage: null,
    mutationFn: async (
      request: ResendVerificationEmailRequest
    ): Promise<ResendVerificationEmailResponse> => {
      return await authService.resendVerificationEmail(request)
    },
  })

  return { resendVerificationEmailMutation }
}
