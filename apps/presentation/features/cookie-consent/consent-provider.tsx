'use client'

import * as React from 'react'
import {
  createContext,
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import {
  allAccepted,
  allRejected,
  type ConsentCategories,
  type ConsentState,
} from './cookie-consent-config'
import { clearConsent, writeConsent } from './consent-cookie'
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
  /** The banner should be shown (ready + no stored choice). */
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
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)

  const persist = useCallback((categories: ConsentCategories) => {
    writeConsent(categories)
    emitConsentChange()
    setIsPreferencesOpen(false)
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
    clearConsent()
    emitConsentChange()
    setIsPreferencesOpen(false)
  }, [])

  const value = useMemo<ConsentContextValue>(
    () => ({
      consentState,
      isReady,
      isBannerVisible: isReady && consentState === null,
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
