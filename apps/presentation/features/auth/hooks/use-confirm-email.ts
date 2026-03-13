'use client'

import { useBffClientMutation } from '@/lib/bff/utils/mutations'
import { authMutationKeys } from '../auth-keys'
import { useAuthService } from './use-auth-service'
import type {
  ConfirmEmailRequest,
  ConfirmEmailResponse,
} from '@core/contracts/auth/confirm-email'

export interface UseConfirmEmailOptions {
  /** Called when email is verified (or already verified). Page is responsible for redirect/navigation. */
  onVerified?: () => void
}

/**
 * Confirm email mutation. Cache invalidation (customer) is handled by global MutationCache in query provider.
 * Redirect after verification is the page's responsibility (pass onVerified).
 */
export function useConfirmEmail(options?: UseConfirmEmailOptions) {
  const { authService } = useAuthService()

  const confirmEmailMutation = useBffClientMutation({
    mutationKey: authMutationKeys.confirmEmail(),
    // errorMessage undefined = default "Something went wrong" toast
    mutationFn: async (
      request: ConfirmEmailRequest
    ): Promise<ConfirmEmailResponse> => {
      return await authService.confirmEmail(request)
    },
    onSuccess: (response) => {
      if (response.success || response.alreadyVerified) {
        options?.onVerified?.()
      }
    },
  })

  return { confirmEmailMutation }
}
