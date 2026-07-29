'use client'

import { CookieBanner } from './cookie-banner'
import { CookiePreferencesDialog } from './cookie-preferences-dialog'

/**
 * Mounts the consent UI (banner + preferences dialog). Must be rendered inside a
 * {@link ConsentProvider}. The provider is mounted higher in the layout so the
 * footer trigger shares the same consent state.
 */
export function CookieConsent() {
  return (
    <>
      <CookieBanner />
      <CookiePreferencesDialog />
    </>
  )
}
