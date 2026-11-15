const UNREACHABLE_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_SOCKET',
])

function readCode(value: unknown): string | undefined {
  if (value && typeof value === 'object' && 'code' in value) {
    return typeof value.code === 'string' ? value.code : undefined
  }
  return undefined
}

/** Extracts the network error code (e.g. ECONNREFUSED) from a failed fetch. */
export function getNetworkErrorCode(error: unknown): string | undefined {
  const cause = error instanceof Error ? error.cause : undefined
  const code = readCode(cause)
  if (code) {
    return code
  }
  if (cause instanceof AggregateError) {
    return readCode(cause.errors[0])
  }
  return undefined
}

export function isBffUnreachableCode(code: string | undefined): code is string {
  return code !== undefined && UNREACHABLE_CODES.has(code)
}

/** Thrown when the BFF cannot be reached at all (not running, crashed, wrong URL). */
export class BffUnreachableError extends Error {
  constructor(
    readonly bffUrl: string,
    readonly code: string,
    options?: ErrorOptions
  ) {
    super(
      `BFF unreachable at ${bffUrl} (${code}). Is the BFF running? In dev, check the @apps/bff output — TypeScript errors prevent it from starting.`,
      options
    )
    this.name = 'BffUnreachableError'
    Object.setPrototypeOf(this, BffUnreachableError.prototype)
  }
}
