'use client'

import { useBffClientMutation } from '@/lib/bff/utils/mutations'
import { useAuthService } from './use-auth-service'
import { authMutationKeys } from '../auth-keys'
import {
  getLoginErrorTranslationKey,
  type LoginErrorTranslationKey,
} from '../lib/error-translations'
import type { LoginRequest, LoginResponse } from '@core/contracts/auth/login'

/**
 * Login mutation. Cache invalidation (customer, cart) is handled by global MutationCache in query provider.
 */
export function useLogin() {
  const { authService } = useAuthService()

  const loginMutation = useBffClientMutation({
    mutationKey: authMutationKeys.login(),
    // errorMessage undefined = default toast (form may show specific message from response)
    mutationFn: async (
      request: LoginRequest
    ): Promise<
      LoginResponse & { errorTranslationKey?: LoginErrorTranslationKey }
    > => {
      const response = await authService.login(request)
      return {
        ...response,
        errorTranslationKey:
          !response.success && response.statusCode
            ? getLoginErrorTranslationKey(response.statusCode)
            : undefined,
      }
    },
  })

  return { loginMutation }
}
