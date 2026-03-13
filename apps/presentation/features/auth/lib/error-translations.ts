import {
  COMMON_ERROR_KEYS,
  createErrorTranslationKeyGetter,
  type CommonErrorTranslationKey,
} from '@/lib/error-translation-keys'

// --- Login (auth-only) ---

export type LoginErrorTranslationKey =
  | CommonErrorTranslationKey
  | 'errors.unauthorized'
  | 'errors.emailNotVerified'

const LOGIN_ERROR_KEY_MAP: Record<number, LoginErrorTranslationKey> = {
  ...COMMON_ERROR_KEYS,
  401: 'errors.unauthorized',
  403: 'errors.emailNotVerified',
}

export const getLoginErrorTranslationKey =
  createErrorTranslationKeyGetter(LOGIN_ERROR_KEY_MAP)

// --- Register (auth-only) ---

export type RegisterErrorTranslationKey =
  | CommonErrorTranslationKey
  | 'errors.forbidden'
  | 'errors.conflict'

const REGISTER_ERROR_KEY_MAP: Record<number, RegisterErrorTranslationKey> = {
  ...COMMON_ERROR_KEYS,
  403: 'errors.forbidden',
  409: 'errors.conflict',
}

export const getRegisterErrorTranslationKey = createErrorTranslationKeyGetter(
  REGISTER_ERROR_KEY_MAP
)

// --- Confirm email (auth-only) ---

export type ConfirmEmailErrorTranslationKey =
  | CommonErrorTranslationKey
  | 'errors.forbidden'
  | 'errors.unauthorized'
  | 'errors.confirmFailed'

const CONFIRM_EMAIL_ERROR_KEY_MAP: Record<
  number,
  ConfirmEmailErrorTranslationKey
> = {
  ...COMMON_ERROR_KEYS,
  401: 'errors.unauthorized',
  403: 'errors.forbidden',
}

const CONFIRM_EMAIL_FALLBACK_KEY = 'errors.confirmFailed' as const

const getConfirmEmailKeyByStatusCode = createErrorTranslationKeyGetter(
  CONFIRM_EMAIL_ERROR_KEY_MAP
)

export function getConfirmEmailErrorTranslationKey(
  statusCode: number | undefined
): ConfirmEmailErrorTranslationKey {
  if (!statusCode) {
    return CONFIRM_EMAIL_FALLBACK_KEY
  }
  return getConfirmEmailKeyByStatusCode(statusCode)
}
