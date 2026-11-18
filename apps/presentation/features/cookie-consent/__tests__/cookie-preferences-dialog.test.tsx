import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConsentProvider } from '../consent-provider'
import { CookieConsent } from '../cookie-consent'
import { CookieFooterTrigger } from '../cookie-footer-trigger'
import { clearConsent, readConsent, writeConsent } from '../consent-cookie'
import { allRejected, type ConsentCategories } from '../cookie-consent-config'

async function openPreferencesFromFooter(stored: ConsentCategories) {
  writeConsent(stored)
  const user = userEvent.setup()
  render(
    <ConsentProvider>
      <CookieFooterTrigger />
      <CookieConsent />
    </ConsentProvider>
  )

  await user.click(
    screen.getByRole('button', { name: 'cookieConsent.footerLink' })
  )
  const dialog = await screen.findByRole('dialog')
  expect(dialog).toHaveAccessibleName('cookieConsent.preferences.title')
  return user
}

function categorySwitch(category: keyof ConsentCategories) {
  return screen.getByRole('switch', {
    name: `cookieConsent.categories.${category}.name`,
  })
}

describe('CookiePreferencesDialog', () => {
  beforeEach(() => {
    clearConsent()
  })

  it('seeds the toggles from the stored choice', async () => {
    await openPreferencesFromFooter({ analytics: true, marketing: false })

    expect(categorySwitch('analytics')).toBeChecked()
    expect(categorySwitch('marketing')).not.toBeChecked()
    expect(
      screen.getByRole('switch', {
        name: 'cookieConsent.categories.essential.name',
      })
    ).toBeDisabled()
  })

  it('saves a single toggled category and closes', async () => {
    const user = await openPreferencesFromFooter(allRejected())

    await user.click(categorySwitch('analytics'))
    await user.click(
      screen.getByRole('button', {
        name: 'cookieConsent.actions.savePreferences',
      })
    )

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(readConsent()?.categories).toEqual({
      analytics: true,
      marketing: false,
    })
  })

  it('accepts all categories from the dialog and closes', async () => {
    const user = await openPreferencesFromFooter(allRejected())

    await user.click(
      screen.getByRole('button', { name: 'cookieConsent.actions.acceptAll' })
    )

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(readConsent()?.categories).toEqual({
      analytics: true,
      marketing: true,
    })
  })
})
