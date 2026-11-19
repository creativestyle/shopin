import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConsentProvider } from '../consent-provider'
import { CookieConsent } from '../cookie-consent'
import { CookieFooterTrigger } from '../cookie-footer-trigger'
import { clearConsent, readConsent, writeConsent } from '../consent-cookie'
import {
  allAccepted,
  allRejected,
  type ConsentCategories,
} from '../cookie-consent-config'
import { reloadPage } from '../reload-page'

jest.mock('../reload-page', () => ({ reloadPage: jest.fn() }))

const mockReloadPage = jest.mocked(reloadPage)

async function saveDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole('button', {
      name: 'cookieConsent.actions.savePreferences',
    })
  )
}

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
    mockReloadPage.mockClear()
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
    await saveDialog(user)

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(readConsent()?.categories).toEqual({
      analytics: true,
      marketing: false,
    })
  })

  it('reloads the page when a granted category is withdrawn', async () => {
    const user = await openPreferencesFromFooter(allAccepted())

    await user.click(categorySwitch('analytics'))
    await saveDialog(user)

    expect(mockReloadPage).toHaveBeenCalledTimes(1)
    expect(readConsent()?.categories.analytics).toBe(false)
  })

  it('does not reload when a category is newly granted', async () => {
    const user = await openPreferencesFromFooter(allRejected())

    await user.click(categorySwitch('marketing'))
    await saveDialog(user)

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(readConsent()?.categories.marketing).toBe(true)
    expect(mockReloadPage).not.toHaveBeenCalled()
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
