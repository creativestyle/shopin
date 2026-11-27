import { headers } from 'next/headers'

/** Set by proxy.ts: the public path without locale prefix, plus the query string. */
export const REQUEST_PATH_HEADER = 'x-shopin-request-path'

/** Path and query of the current request, for layouts that receive neither. */
export async function getRequestPath(): Promise<string | null> {
  return (await headers()).get(REQUEST_PATH_HEADER)
}
