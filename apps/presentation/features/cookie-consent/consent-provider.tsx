'use client'

import * as React from 'react'
import {
  createContext,
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { useIsLegalRoute } from '@/hooks/use-is-legal-route'
import {
  CONSENT_CATEGORIES,
  allAccepted,
  allRejected,
  type ConsentCategories,
  type ConsentState,
} from './cookie-consent-config'
import { clearConsent, readConsent, writeConsent } from './consent-cookie'
import {
  emitConsentChange,
  getConsentSnapshot,
  getServerConsentSnapshot,
  subscribeConsent,
} from './consent-store'

export interface ConsentContextValue {
  /** Stored consent, or `null` if the visitor has not chosen yet. */
  consentState: ConsentState | null
  /** True once hydrated on the client (avoids rendering the banner during SSR). */
  isReady: boolean
  /** The banner should be shown (ready + no stored choice + not a legal page). */
  isBannerVisible: boolean
  /** The preferences dialog is open. */
  isPreferencesOpen: boolean
  /** Persist an explicit per-category choice. */
  updateConsent: (categories: ConsentCategories) => void
  acceptAll: () => void
  /** Reject non-essential categories; essential cookies always stay on. */
  rejectNonEssential: () => void
  openPreferences: () => void
  closePreferences: () => void
  /** Clears the stored choice and re-shows the banner. */
  resetConsent: () => void
}

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined)

export { ConsentContext }

// Stable references for the "have we hydrated yet" store.
const noopSubscribe = () => () => {}
const getHydrated = () => true
const getNotHydrated = () => false

function isWithdrawal(
  previous: ConsentState | null,
  next: ConsentCategories | null
): boolean {
  return CONSENT_CATEGORIES.some(
    (category) =>
      previous?.categories[category] === true && next?.[category] !== true
  )
}

// Tag code that already ran can't be unloaded, so withdrawal reloads the page.
function applyConsent(next: ConsentCategories | null): boolean {
  const withdrawn = isWithdrawal(readConsent(), next)
  if (next) {
    writeConsent(next)
  } else {
    clearConsent()
  }
  if (withdrawn) {
    window.location.reload()
    return false
  }
  emitConsentChange()
  return true
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const consentState = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot
  )
  const isReady = useSyncExternalStore(
    noopSubscribe,
    getHydrated,
    getNotHydrated
  )
  const isLegalRoute = useIsLegalRoute()
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)

  const persist = useCallback((categories: ConsentCategories) => {
    if (applyConsent(categories)) {
      setIsPreferencesOpen(false)
    }
  }, [])

  const updateConsent = useCallback(
    (categories: ConsentCategories) => persist(categories),
    [persist]
  )
  const acceptAll = useCallback(() => persist(allAccepted()), [persist])
  const rejectNonEssential = useCallback(
    () => persist(allRejected()),
    [persist]
  )

  const openPreferences = useCallback(() => setIsPreferencesOpen(true), [])
  const closePreferences = useCallback(() => setIsPreferencesOpen(false), [])

  const resetConsent = useCallback(() => {
    if (applyConsent(null)) {
      setIsPreferencesOpen(false)
    }
  }, [])

  const value = useMemo<ConsentContextValue>(
    () => ({
      consentState,
      isReady,
      isBannerVisible: isReady && consentState === null && !isLegalRoute,
      isPreferencesOpen,
      updateConsent,
      acceptAll,
      rejectNonEssential,
      openPreferences,
      closePreferences,
      resetConsent,
    }),
    [
      consentState,
      isReady,
      isLegalRoute,
      isPreferencesOpen,
      updateConsent,
      acceptAll,
      rejectNonEssential,
      openPreferences,
      closePreferences,
      resetConsent,
    ]
  )

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  )
}
