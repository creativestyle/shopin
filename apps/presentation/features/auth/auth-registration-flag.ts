'use client'

import { useSyncExternalStore } from 'react'

const REGISTRATION_COMPLETED_KEY = 'registration-completed'

const subscribe = () => () => {}

const getSnapshot = (): boolean =>
  sessionStorage.getItem(REGISTRATION_COMPLETED_KEY) === 'true'

/** Marks that registration finished in this tab, so the success page can be shown. */
export function markRegistrationCompleted(): void {
  if (typeof window === 'undefined') {
    return
  }
  sessionStorage.setItem(REGISTRATION_COMPLETED_KEY, 'true')
}

/** Returns null until the flag can be read on the client. */
export function useHasCompletedRegistration(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null)
}
