/**
 * Utilities for **inspecting** HTTP errors (client or server).
 * BFF client throws errors whose message starts with "STATUS_CODE STATUS_TEXT"
 * (e.g. "409 Conflict (BFF POST /cart, correlationId: …)");
 * 429 is thrown as RateLimitError with the same message format.
 */
export class HttpError {
  /**
   * Extracts HTTP status code from an Error object
   * @param error - The error to extract status code from
   * @returns The status code if found, null otherwise
   */
  static getStatusCode(error: unknown): number | null {
    if (!(error instanceof Error)) {
      return null
    }

    // BaseService error messages start with the status code, e.g. "409 Conflict (BFF …)"
    const match = error.message.match(/^(\d{3})/)
    if (match) {
      return parseInt(match[1], 10)
    }

    return null
  }

  /**
   * Checks if an error has a specific HTTP status code
   * @param error - The error to check
   * @param statusCode - The status code to check for
   * @returns True if the error has the specified status code
   */
  static hasStatusCode(error: unknown, statusCode: number): boolean {
    return HttpError.getStatusCode(error) === statusCode
  }

  /**
   * Checks if an error is an authentication error (401 or 403)
   * @param error - The error to check
   * @returns True if the error is 401 or 403
   */
  static isAuthError(error: unknown): boolean {
    const statusCode = HttpError.getStatusCode(error)
    return statusCode === 401 || statusCode === 403
  }

  /**
   * Checks if an error is a conflict error (409)
   * Typically indicates a resource already exists or there's a conflict
   * @param error - The error to check
   * @returns True if the error is 409
   */
  static isConflictError(error: unknown): boolean {
    return HttpError.hasStatusCode(error, 409)
  }

  /**
   * Checks if an error is a rate limit error (429)
   * Indicates too many requests; user should retry later
   * @param error - The error to check
   * @returns True if the error is 429
   */
  static isTooManyRequestsError(error: unknown): boolean {
    return HttpError.hasStatusCode(error, 429)
  }
}
