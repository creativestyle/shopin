import { RateLimitError } from './rate-limit-error'

export function normalizeStatusCode(statusCode: number): number {
  if (statusCode >= 500) {
    return 500
  }
  return statusCode
}

export async function parseValidationErrorMessage(
  response: Response
): Promise<string | undefined> {
  try {
    const errorBody = await response.json()
    if (errorBody.issues && Array.isArray(errorBody.issues)) {
      const issueMessages = errorBody.issues
        .map((issue: { message?: string }) => issue.message)
        .filter(Boolean)
      if (issueMessages.length > 0) {
        return issueMessages.join('. ')
      }
    }
    return errorBody.message
  } catch {
    return undefined
  }
}

type BaseErrorResponse = {
  success: boolean
  statusCode?: number
}

export async function handleErrorResponse<T extends BaseErrorResponse>(
  response: Response
): Promise<T> {
  const statusCode = normalizeStatusCode(response.status)

  if (statusCode === 429) {
    throw new RateLimitError()
  }

  if (statusCode === 400) {
    const message = await parseValidationErrorMessage(response)
    const errorResponse = {
      success: false as const,
      statusCode,
      ...(message && { message }),
    }
    return errorResponse as unknown as T
  }

  return {
    success: false as const,
    statusCode,
  } as unknown as T
}
