/**
 * Auth audit event types for security and compliance logging.
 * Aligns with common e-commerce and OWASP-style auth audit practices.
 * Do not log passwords, tokens, or other secrets.
 */

export const AUTH_ACTIONS = [
  'login',
  'logout',
  'register',
  'confirm_email',
  'password_change',
  'token_refresh',
  'forgot_password',
  'reset_password',
] as const

export type AuthAction = (typeof AUTH_ACTIONS)[number]

export type AuthOutcome = 'success' | 'failure'

/**
 * Short, stable reason for failure (e.g. invalid_credentials, user_exists, error for thrown exceptions).
 * Omit for success.
 */
export type AuthFailureReason =
  | 'invalid_credentials'
  | 'user_exists'
  | 'invalid_token'
  | 'token_expired'
  | 'validation_failed'
  | 'unauthorized'
  | 'unknown'
  | 'error'

/** Base fields shared by all auth log contexts. */
export interface AuthLogContextBase {
  action: AuthAction
  /** Customer/user identifier when available (e.g. after login). Never log email in auth logs. */
  userId?: string
  /** Client IP (from request). */
  ip?: string
  /** User-Agent (from request). */
  userAgent?: string
  /** Request correlation ID for tracing. */
  correlationId?: string
  /** Extra context; no PII. */
  metadata?: Record<string, unknown>
}

export interface AuthLogSuccess extends AuthLogContextBase {
  outcome: 'success'
}

export interface AuthLogFailure extends AuthLogContextBase {
  outcome: 'failure'
  /** Short reason for failure (e.g. invalid_credentials, user_exists, error for thrown exceptions). */
  reason: AuthFailureReason
}

export type AuthLogContext = AuthLogSuccess | AuthLogFailure
