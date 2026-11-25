/**
 * API error type guard (e.g. for 404 in reset).
 */
export type ApiError = Error & {
  response?: { status?: number }
  status?: number
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && ('response' in error || 'status' in error)
}

/** True if the error is an HTTP 404 (resource not found). */
export function isNotFoundError(error: unknown): boolean {
  if (error == null || typeof error !== 'object') {
    return false
  }
  const o = error as {
    status?: number
    response?: { status?: number }
    name?: string
    message?: string
  }
  if (o.status === 404 || o.response?.status === 404) {
    return true
  }
  if (o.name === 'NotFound') {
    return true
  }
  if (typeof o.message === 'string' && /"status"\s*:\s*404/.test(o.message)) {
    return true
  }
  return false
}
