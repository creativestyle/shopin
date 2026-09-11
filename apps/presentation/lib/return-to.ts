import type { ReadonlyURLSearchParams } from 'next/navigation'

type ClientSearchParams = ReadonlyURLSearchParams | URLSearchParams
type ServerSearchParams = Record<string, string | string[] | undefined>

const RETURN_TO_PARAM = 'returnTo'

// Same-site paths only — an absolute URL or protocol-relative path here is an open redirect.
function sanitize(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/')) {
    return null
  }
  if (value.startsWith('//') || value.startsWith('/\\')) {
    return null
  }
  return value
}

export function getReturnTo(
  searchParams?: ClientSearchParams | null
): string | null {
  return sanitize(searchParams?.get(RETURN_TO_PARAM))
}

export function getReturnToServer(
  searchParams?: ServerSearchParams | null
): string | null {
  const value = searchParams?.[RETURN_TO_PARAM]
  return sanitize(typeof value === 'string' ? value : null)
}

export function setReturnTo(
  params: URLSearchParams,
  returnTo: string | null
): void {
  const safe = sanitize(returnTo)
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
