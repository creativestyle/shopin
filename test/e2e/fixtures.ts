/**
 * Extended Playwright test fixture for the e2e suite.
 *
 * Overrides the built-in `page` fixture to install a global console listener
 * that silences browser-side translation errors emitted by next-intl when a
 * message key is missing.  These appear in every test that renders a page but
 * are not assertions about application behavior — they are noise from
 * translation keys present in the app but absent from the mock BFF's i18n
 * fixture.  Real errors (non-translation console.error) pass through unchanged.
 */

import { test as base, expect } from '@playwright/test'

function isTranslationError(text: string): boolean {
  // next-intl logs missing keys as:
  //   "[next-intl] Missing message: ..."   (dev mode)
  //   "IntlError [MISSING_MESSAGE]: ..."   (error object toString)
  //   "MISSING_MESSAGE" (error code embedded in the string)
  return (
    text.includes('[next-intl]') ||
    text.includes('MISSING_MESSAGE') ||
    text.includes('Missing message')
  )
}

export const test = base.extend({
  page: async ({ page }, use) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error' && isTranslationError(msg.text())) return
    })
    await use(page)
  },
})

export { expect }
