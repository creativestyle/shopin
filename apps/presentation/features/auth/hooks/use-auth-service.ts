'use client'

import { useBffFetchClient } from '@/lib/bff/core/bff-fetch-client'
import { AuthService } from '../lib/auth-bff-service'

/**
 * Returns the auth BFF service instance for the current client.
 */
export function useAuthService() {
  const bffFetch = useBffFetchClient()
  return { authService: new AuthService(bffFetch) }
}
