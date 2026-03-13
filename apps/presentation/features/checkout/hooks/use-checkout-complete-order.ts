'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useGetOrder } from './use-get-order'
import { getStoredToken, isTokenValid, removeToken } from './use-order-token'

interface UseCheckoutCompleteOrderOptions {
  orderId?: string
  token?: string
}

interface UseCheckoutCompleteOrderResult {
  order: ReturnType<typeof useGetOrder>['data']
  isLoading: boolean
  error: ReturnType<typeof useGetOrder>['error']
  isValid: boolean
}

function redirectToHomepage(
  router: ReturnType<typeof useRouter>,
  locale: string
): void {
  router.push(`/${locale}`)
}

export function useCheckoutCompleteOrder({
  orderId,
  token,
}: UseCheckoutCompleteOrderOptions): UseCheckoutCompleteOrderResult {
  const router = useRouter()
  const locale = useLocale()
  const hasRedirectedRef = useRef(false)
  const isMountedRef = useRef(true)

  const stored = orderId ? getStoredToken(orderId) : null
  const isTokenValidated = !!(
    orderId &&
    token &&
    stored &&
    stored.token === token &&
    isTokenValid(stored.time)
  )

  const {
    data: order,
    isLoading,
    error,
  } = useGetOrder({
    orderId,
    enabled: !!isTokenValidated,
  })

  useEffect(() => {
    if (hasRedirectedRef.current || !isMountedRef.current) {
      return
    }

    if (!isTokenValidated) {
      hasRedirectedRef.current = true
      redirectToHomepage(router, locale)
      return
    }

    if (order && orderId && isMountedRef.current) {
      removeToken(orderId)
    }
  }, [orderId, token, isTokenValidated, order, router, locale])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    order,
    isLoading,
    error,
    isValid: isTokenValidated,
  }
}
