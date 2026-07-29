import { readConsent } from './consent-cookie'
import type { ConsentState } from './cookie-consent-config'

/**
 * External store over the consent cookie, consumed via `useSyncExternalStore`.
 * This reads browser state (the cookie) without a mount effect and stays
 * hydration-safe: the server snapshot is always `null` (unknown), and the
 * client re-reads after hydration.
 */

type Listener = () => void

const listeners = new Set<Listener>()

let cachedState: ConsentState | null = null
let cachedKey: string | null = null
let initialized = false

/** Returns a referentially-stable snapshot, re-parsing only when the cookie changes. */
export function getConsentSnapshot(): ConsentState | null {
  const next = readConsent()
  const key = next ? JSON.stringify(next) : null
  if (!initialized || key !== cachedKey) {
    initialized = true
    cachedKey = key
    cachedState = next
  }
  return cachedState
}

export function getServerConsentSnapshot(): ConsentState | null {
  return null
}

export function subscribeConsent(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Notifies subscribers after the cookie has been written or cleared. */
export function emitConsentChange(): void {
  for (const listener of listeners) {
    listener()
  }
}
