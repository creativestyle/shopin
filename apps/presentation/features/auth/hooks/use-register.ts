'use client'

import { useBffClientMutation } from '@/lib/bff/utils/mutations'
import { useAuthService } from './use-auth-service'
import { authMutationKeys } from '../auth-keys'
import {
  getRegisterErrorTranslationKey,
  type RegisterErrorTranslationKey,
} from '../lib/error-translations'
import type {
  RegisterRequest,
  RegisterResponse,
} from '@core/contracts/auth/register'

/**
 * Register mutation. Cache invalidation (customer, cart) is handled by global MutationCache in query provider.
 */
export function useRegister() {
  const { authService } = useAuthService()

  const registerMutation = useBffClientMutation({
    mutationKey: authMutationKeys.register(),
    // errorMessage undefined = default toast
    mutationFn: async (
      request: RegisterRequest
    ): Promise<
      RegisterResponse & { errorTranslationKey?: RegisterErrorTranslationKey }
    > => {
      const response = await authService.register(request)
      return {
        ...response,
        errorTranslationKey:
          !response.success && response.statusCode
            ? getRegisterErrorTranslationKey(response.statusCode)
            : undefined,
      }
    },
  })

  return { registerMutation }
}
