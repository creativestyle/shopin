/**
 * CORS configuration constants
 */
export const DEFAULT_CORS_METHODS = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'OPTIONS',
] as const

export const DEFAULT_CORS_HEADERS = [
  'Content-Type',
  'Authorization',
  'Accept-Language',
  'X-Data-Source',
  'X-CSRF-Token',
  'x-correlation-id',
  'x-next-draft-mode',
] as const
