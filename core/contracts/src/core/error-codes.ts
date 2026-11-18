import { INVALID_CURRENT_PASSWORD_CODE } from '../customer/customer'

/**
 * Error codes the BFF may forward to the client. Any other `code` on an exception is dropped.
 */
export const PUBLIC_ERROR_CODES: ReadonlySet<string> = new Set([
  INVALID_CURRENT_PASSWORD_CODE,
])
