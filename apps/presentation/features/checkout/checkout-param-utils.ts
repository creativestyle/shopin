import type { ReadonlyURLSearchParams } from 'next/navigation'

type ServerSearchParams = Record<string, string | string[] | undefined>

const IS_CHECKOUT_PARAM = 'isCheckout'

export function getIsCheckout(
  searchParams?: ReadonlyURLSearchParams | URLSearchParams | null
): boolean {
  if (!searchParams) {
    return false
  }

  return searchParams.get(IS_CHECKOUT_PARAM) === 'true'
}

export function getIsCheckoutServer(
  searchParams?: ServerSearchParams | null
): boolean {
  if (!searchParams) {
    return false
  }

  return searchParams[IS_CHECKOUT_PARAM] === 'true'
}

export function setIsCheckoutParam(params: URLSearchParams): void {
  params.set(IS_CHECKOUT_PARAM, 'true')
}

export function setIsCheckoutFromSearchParams(
  params: URLSearchParams,
  searchParams?:
    | ReadonlyURLSearchParams
    | URLSearchParams
    | ServerSearchParams
    | null
): void {
  let isCheckout = false
  if (searchParams) {
    if (searchParams instanceof URLSearchParams || 'get' in searchParams) {
      isCheckout = getIsCheckout(
        searchParams as ReadonlyURLSearchParams | URLSearchParams
      )
    } else {
      isCheckout = getIsCheckoutServer(searchParams)
    }
  }
  if (isCheckout) {
    setIsCheckoutParam(params)
  }
}
