/**
 * Auth mutation keys. Single source of truth for auth-related mutationKey in React Query.
 */

export const authMutationKeys = {
  all: ['auth'] as const,
  login: () => [...authMutationKeys.all, 'login'] as const,
  logout: () => [...authMutationKeys.all, 'logout'] as const,
  register: () => [...authMutationKeys.all, 'register'] as const,
  confirmEmail: () => [...authMutationKeys.all, 'confirmEmail'] as const,
  forgotPassword: () => [...authMutationKeys.all, 'forgotPassword'] as const,
  resetPassword: () => [...authMutationKeys.all, 'resetPassword'] as const,
  resendVerificationEmail: () =>
    [...authMutationKeys.all, 'resendVerificationEmail'] as const,
}

export type AuthMutationKind =
  | 'login'
  | 'logout'
  | 'register'
  | 'confirmEmail'
  | 'forgotPassword'
  | 'resetPassword'
  | 'resendVerificationEmail'

export function isAuthMutationKey(
  key: unknown
): key is readonly [string, AuthMutationKind] {
  return (
    Array.isArray(key) &&
    key[0] === authMutationKeys.all[0] &&
    [
      'login',
      'logout',
      'register',
      'confirmEmail',
      'forgotPassword',
      'resetPassword',
      'resendVerificationEmail',
    ].includes(String(key[1]))
  )
}
