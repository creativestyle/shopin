'use client'

const TEN_MINUTES = 10 * 60 * 1000

export function generateToken(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

export function getStoredToken(
  orderId: string
): { token: string; time: number } | null {
  if (typeof window === 'undefined') {
    return null
  }

  const token = sessionStorage.getItem(`order-access-${orderId}`)
  const time = sessionStorage.getItem(`order-time-${orderId}`)

  if (!token || !time) {
    return null
  }

  const orderTime = parseInt(time, 10)
  if (Date.now() - orderTime >= TEN_MINUTES) {
    return null
  }

  return { token, time: orderTime }
}

export function isTokenValid(storedTime: number): boolean {
  return Date.now() - storedTime < TEN_MINUTES
}

export function saveToken(orderId: string, token: string): void {
  if (typeof window === 'undefined') {
    return
  }
  sessionStorage.setItem(`order-access-${orderId}`, token)
  sessionStorage.setItem(`order-time-${orderId}`, Date.now().toString())
}

export function removeToken(orderId: string): void {
  if (typeof window === 'undefined') {
    return
  }
  sessionStorage.removeItem(`order-access-${orderId}`)
  sessionStorage.removeItem(`order-time-${orderId}`)
}
