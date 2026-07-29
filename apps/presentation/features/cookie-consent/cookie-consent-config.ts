/**
 * Cookie-consent configuration and shared types.
 *
 * Consent is stored in a first-party cookie (readable server-side, so future
 * SSR-injected scripts can be gated) with a 12-month expiry, per EU guidance.
 */

/** Non-essential cookie categories the visitor can opt into. */
export const CONSENT_CATEGORIES = ['analytics', 'marketing'] as const

export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number]

/** Per-category opt-in flags. Essential cookies are always on and not tracked here. */
export type ConsentCategories = Record<ConsentCategory, boolean>

export interface ConsentState {
  /** Schema version — bumping it invalidates stored consent and re-shows the banner. */
  version: number
  /** Epoch milliseconds the choice was saved. */
  timestamp: number
  categories: ConsentCategories
}

export const CONSENT_COOKIE_NAME = 'cookie_consent'

/** 12 months, the typical EU maximum for consent validity. */
export const CONSENT_EXPIRY_DAYS = 365

export const CONSENT_VERSION = 1

export function allAccepted(): ConsentCategories {
  return { analytics: true, marketing: true }
}

export function allRejected(): ConsentCategories {
  return { analytics: false, marketing: false }
}
