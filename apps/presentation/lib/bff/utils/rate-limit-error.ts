/**
 * Thrown by the BFF client when the BFF returns 429 Too Many Requests.
 * Message is "429 Too Many Requests" so HttpError.getStatusCode(error) still works on server.
 */
export class RateLimitError extends Error {
  constructor(message = '429 Too Many Requests') {
    super(message)
    this.name = 'RateLimitError'
    Object.setPrototypeOf(this, RateLimitError.prototype)
  }
}
