import { readConsent, writeConsent, clearConsent } from '../consent-cookie'
import {
  CONSENT_COOKIE_NAME,
  CONSENT_EXPIRY_DAYS,
  CONSENT_VERSION,
} from '../cookie-consent-config'

function setRawCookie(value: string) {
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; path=/`
}

describe('consent-cookie', () => {
  beforeEach(() => {
    clearConsent()
  })

  it('returns null when no consent cookie exists', () => {
    expect(readConsent()).toBeNull()
  })

  it('writes and reads back a consent choice', () => {
    writeConsent({ analytics: true, marketing: false })

    const stored = readConsent()
    expect(stored).not.toBeNull()
    expect(stored?.version).toBe(CONSENT_VERSION)
    expect(stored?.categories).toEqual({ analytics: true, marketing: false })
    expect(typeof stored?.timestamp).toBe('number')
  })

  it('returns null for a stored version mismatch', () => {
    const encoded = encodeURIComponent(
      JSON.stringify({
        version: CONSENT_VERSION + 1,
        timestamp: 0,
        categories: { analytics: true, marketing: true },
      })
    )
    setRawCookie(encoded)

    expect(readConsent()).toBeNull()
  })

  it('returns null for malformed cookie content', () => {
    setRawCookie('not-json')

    expect(readConsent()).toBeNull()
  })

  it('coerces missing categories to false', () => {
    const encoded = encodeURIComponent(
      JSON.stringify({
        version: CONSENT_VERSION,
        timestamp: Date.now(),
        categories: { analytics: true },
      })
    )
    setRawCookie(encoded)

    expect(readConsent()?.categories).toEqual({
      analytics: true,
      marketing: false,
    })
  })

  it('returns null when the stored choice is older than the expiry period', () => {
    const expiredTimestamp =
      Date.now() - (CONSENT_EXPIRY_DAYS + 1) * 24 * 60 * 60 * 1000
    const encoded = encodeURIComponent(
      JSON.stringify({
        version: CONSENT_VERSION,
        timestamp: expiredTimestamp,
        categories: { analytics: true, marketing: true },
      })
    )
    setRawCookie(encoded)

    expect(readConsent()).toBeNull()
  })

  it('clears a stored choice', () => {
    writeConsent({ analytics: true, marketing: true })
    expect(readConsent()).not.toBeNull()

    clearConsent()
    expect(readConsent()).toBeNull()
  })
})
