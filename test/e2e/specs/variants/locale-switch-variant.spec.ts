/**
 * Locale switch resolves the localized slug through the BFF.
 *
 * The resolveLocalizedPath server action runs in the request's variant context and asks
 * the BFF for the target locale's slug. Runs on any config; the provider-selecting cases
 * (an alt search provider's catalog) are the demo's: demo/e2e/specs/locale-switch-variant.spec.ts.
 *
 * Locale-switcher DOM (verified against real component):
 *   Trigger: <button role="button" aria-label="Select language"> (icon-only — flag SVG)
 *     Located in the <header> (role="banner") via UserMenuWrapper.
 *     Also rendered in the footer — scope to banner to avoid ambiguity.
 *   Options: <div role="option"> with visible text = nativeName (e.g. "Deutsch", "English")
 *     Rendered inline in a listbox (NOT portaled); opened when the trigger is clicked.
 *   Selection: calls window.location.assign() → full page navigation.
 */

import { test, expect } from '../../fixtures'

test.describe('Locale switch resolves the localized slug', () => {
    test('locale switch on a product page resolves the localized slug through the BFF', async ({
      page,
    }) => {
      // Probe slugs have slugByLocale { 'en-US': slug, 'de-DE': 'de-<slug>' }, so
      // landing on /de/p/de-probe-locale-switch means the correct catalog was used.
      // Note: BFF-call counting is not used here because Next.js data cache serves the
      // slug-resolution response from the page-render cache (same URL + headers → no
      // new network call), making the count unobservable without disabling caching.
      await page.goto('/en/p/probe-locale-switch')
      await page.waitForLoadState('networkidle')

      const langTrigger = page
        .getByRole('banner')
        .getByRole('button', { name: 'Select language' })
      await langTrigger.click()

      const deOption = page.getByRole('option', { name: 'Deutsch' })
      await deOption.waitFor({ state: 'visible', timeout: 10_000 })

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        deOption.click(),
      ])

      // Probe slugByLocale maps 'de-DE' to 'de-<slug>' — arriving here proves the
      // resolver used the BFF.
      expect(page.url()).toMatch(/\/de\/p\/de-probe-locale-switch/)
      await expect(page.locator('html')).toHaveAttribute('lang', /^de/)
      await expect(page.getByText(/de-probe-locale-switch/)).toBeVisible()
    })
  }
)
