import {
  CONSENT_COOKIE_NAME,
  CONSENT_EXPIRY_DAYS,
  CONSENT_VERSION,
  type ConsentCategories,
  type ConsentState,
} from './cookie-consent-config'

const COOKIE_MATCH = new RegExp(`(?:^|; )${CONSENT_COOKIE_NAME}=([^;]*)`)

const CONSENT_EXPIRY_MS = CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000

/**
 * Reads and validates the stored consent state. Returns `null` — meaning the
 * banner should be shown again — when nothing is stored, the value is malformed,
 * the schema version has changed, or the choice is older than the expiry period.
 * The age check backs up the cookie's own `max-age` in case the cookie outlives it.
 */
export function readConsent(): ConsentState | null {
  if (typeof document === 'undefined') {
    return null
  }

  const match = COOKIE_MATCH.exec(document.cookie)
  if (!match) {
    return null
  }

  try {
    const parsed = JSON.parse(
      decodeURIComponent(match[1])
    ) as Partial<ConsentState>
    if (
      parsed.version !== CONSENT_VERSION ||
      typeof parsed.categories !== 'object' ||
      parsed.categories === null
    ) {
      return null
    }

    const timestamp =
      typeof parsed.timestamp === 'number' ? parsed.timestamp : 0
    if (Date.now() - timestamp > CONSENT_EXPIRY_MS) {
      return null
    }

    return {
      version: CONSENT_VERSION,
      timestamp,
      categories: {
        analytics: parsed.categories.analytics === true,
        marketing: parsed.categories.marketing === true,
      },
    }
  } catch {
    return null
  }
}

/** Persists the visitor's consent choice for {@link CONSENT_EXPIRY_DAYS}. */
export function writeConsent(categories: ConsentCategories): void {
  if (typeof document === 'undefined') {
    return
  }

  const state: ConsentState = {
    version: CONSENT_VERSION,
    timestamp: Date.now(),
    categories,
  }
  const maxAge = CONSENT_EXPIRY_DAYS * 24 * 60 * 60
  const secure =
    typeof location !== 'undefined' && location.protocol === 'https:'
  const value = encodeURIComponent(JSON.stringify(state))

  document.cookie =
    `${CONSENT_COOKIE_NAME}=${value}; max-age=${maxAge}; path=/; SameSite=Lax` +
    (secure ? '; Secure' : '')
}

/** Clears the stored consent so the banner reappears (used by "reset"). */
export function clearConsent(): void {
  if (typeof document === 'undefined') {
    return
  }
  document.cookie = `${CONSENT_COOKIE_NAME}=; max-age=0; path=/; SameSite=Lax`
}
