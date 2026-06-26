/**
 * Locale switch on alt-data-source pages resolves slugs against the correct catalog.
 *
 * The resolveLocalizedPath server action runs with variant context so slug resolution
 * uses the right X-Data-Source header — the variant selected by the user's data-source
 * cookie, not the default catalog.
 *
 * Intended-correct:
 *   - Start on /en/p/red-shoes (alt catalog product, en slug)
 *   - Switch to German locale
 *   - resolveLocalizedPath server action runs with alt variant context
 *   - BFF request to /product/slug/red-shoes/page carries X-Data-Source: commercetools-algolia-set
 *   - Browser lands on /de/p/rote-schuhe (the German slug from alt catalog)
 *
 * Locale-switcher DOM (verified against real component):
 *   Trigger: <button role="button" aria-label="Select language"> (icon-only — flag SVG)
 *     Located in the <header> (role="banner") via UserMenuWrapper.
 *     Also rendered in the footer — scope to banner to avoid ambiguity.
 *   Options: <div role="option"> with visible text = nativeName (e.g. "Deutsch", "English")
 *     Rendered inline in a listbox (NOT portaled); opened when the trigger is clicked.
 *   Selection: calls window.location.assign() → full page navigation.
 *
 * Fixture setup:
 *   - ALT_PRODUCTS["red-shoes"].slugByLocale = { "en-US": "red-shoes", "de-DE": "rote-schuhe" }
 *   - DEFAULT_PRODUCTS has NO "red-shoes" entry → mock returns 404 for default catalog
 *   - This makes the wrong-backend resolution observable: final URL diverges from expected.
 */

import { test, expect } from '../../fixtures'
import { setDataSourceCookie, resetRequests } from '../../helpers'

test.describe('Locale switch on alt-data-source page resolves correct catalog', () => {
    test.beforeEach(async ({ context }) => {
      await setDataSourceCookie(context, 'commercetools-algolia-set')
    })

    test('locale switch on alt-catalog product page resolves to correct localized slug', async ({
      page,
    }) => {
      await page.goto('/en/p/red-shoes')
      await page.waitForLoadState('networkidle')
      await resetRequests()

      // The trigger is an icon-only button scoped to the header
      const langTrigger = page
        .getByRole('banner')
        .getByRole('button', { name: 'Select language' })
      await langTrigger.click()

      // Options are role=option with nativeName text
      const deOption = page.getByRole('option', { name: 'Deutsch' })
      await deOption.waitFor({ state: 'visible', timeout: 10_000 })

      // Selection triggers window.location.assign (full navigation)
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        deOption.click(),
      ])

      // INTENDED-CORRECT: land on the German alt-catalog slug
      expect(page.url()).toMatch(/\/de\/p\/rote-schuhe/)
      await expect(page.locator('html')).toHaveAttribute('lang', /^de/)
      await expect(page.getByRole('heading', { name: 'Rote Schuhe' })).toBeVisible()
    })

    test('locale switch from alt-catalog product also works for probe slugs', async ({
      page,
    }) => {
      // Complementary coverage: verify the locale switch works for probe-catalog slugs
      // (different slug from test 1 → independent coverage of the resolver).
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
      // resolver used the BFF (and served the alt-data-source fixture, since that's
      // what the data-source cookie selects).
      expect(page.url()).toMatch(/\/de\/p\/de-probe-locale-switch/)
      await expect(page.locator('html')).toHaveAttribute('lang', /^de/)
      await expect(page.getByText(/de-probe-locale-switch/)).toBeVisible()
    })
  }
)
