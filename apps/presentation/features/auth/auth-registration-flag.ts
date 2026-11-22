'use client'

import { useSyncExternalStore } from 'react'

const REGISTRATION_COMPLETED_KEY = 'registration-completed'

const subscribe = () => () => {}

const getSnapshot = (): boolean => {
  try {
    return sessionStorage.getItem(REGISTRATION_COMPLETED_KEY) === 'true'
  } catch {
    return false
  }
}

/** Marks that registration finished in this tab, so the success page can be shown. */
export function markRegistrationCompleted(): void {
  try {
    sessionStorage.setItem(REGISTRATION_COMPLETED_KEY, 'true')
  } catch {
    // Storage unavailable; the success page will redirect home.
  }
}

/** Clears the flag once the flow moves past the success page. */
export function clearRegistrationCompleted(): void {
  try {
    sessionStorage.removeItem(REGISTRATION_COMPLETED_KEY)
  } catch {
    // Storage unavailable; nothing to clear.
  }
}

/** Returns null until the flag can be read on the client. */
export function useHasCompletedRegistration(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null)
}
