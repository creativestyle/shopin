import type { ReadonlyURLSearchParams } from 'next/navigation'
import { isSafeRelativePath } from './safe-relative-path'

type ClientSearchParams = ReadonlyURLSearchParams | URLSearchParams
type ServerSearchParams = Record<string, string | string[] | undefined>

const RETURN_TO_PARAM = 'returnTo'

// Same-site paths only — anything else here is an open redirect.
export function sanitizeReturnTo(
  value: string | null | undefined
): string | null {
  return value && isSafeRelativePath(value) ? value : null
}

export function getReturnTo(
  searchParams?: ClientSearchParams | null
): string | null {
  return sanitizeReturnTo(searchParams?.get(RETURN_TO_PARAM))
}

export function getReturnToServer(
  searchParams?: ServerSearchParams | null
): string | null {
  const value = searchParams?.[RETURN_TO_PARAM]
  return sanitizeReturnTo(typeof value === 'string' ? value : null)
}

export function setReturnTo(
  params: URLSearchParams,
  returnTo: string | null
): void {
  const safe = sanitizeReturnTo(returnTo)
  if (safe) {
    params.set(RETURN_TO_PARAM, safe)
  }
}

export function setReturnToFromSearchParams(
  params: URLSearchParams,
  searchParams?: ClientSearchParams | ServerSearchParams | null
): void {
  if (!searchParams) {
    return
  }

  const returnTo =
    'get' in searchParams
      ? getReturnTo(searchParams as ClientSearchParams)
      : getReturnToServer(searchParams as ServerSearchParams)

  setReturnTo(params, returnTo)
}
