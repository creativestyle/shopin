import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConsentProvider } from '../consent-provider'
import { CookieBanner } from '../cookie-banner'
import { clearConsent, readConsent } from '../consent-cookie'

function renderBanner() {
  return render(
    <ConsentProvider>
      <CookieBanner />
    </ConsentProvider>
  )
}

describe('CookieBanner', () => {
  beforeEach(() => {
    clearConsent()
  })

  it('shows on first visit with accept/reject/customise actions and takes focus', async () => {
    renderBanner()

    const banner = await screen.findByRole('dialog')
    expect(banner).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'cookieConsent.actions.acceptAll' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'cookieConsent.actions.essentialOnly',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'cookieConsent.actions.customise' })
    ).toBeInTheDocument()

    await waitFor(() =>
      expect(banner.contains(document.activeElement)).toBe(true)
    )
  })

  it('accepting all persists consent and dismisses the banner', async () => {
    const user = userEvent.setup()
    renderBanner()

    await user.click(
      await screen.findByRole('button', {
        name: 'cookieConsent.actions.acceptAll',
      })
    )

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(readConsent()?.categories).toEqual({
      analytics: true,
      marketing: true,
    })
  })

  it('rejecting all persists a non-essential opt-out', async () => {
    const user = userEvent.setup()
    renderBanner()

    await user.click(
      await screen.findByRole('button', {
        name: 'cookieConsent.actions.essentialOnly',
      })
    )

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(readConsent()?.categories).toEqual({
      analytics: false,
      marketing: false,
    })
  })

  it('does not render when a choice is already stored', async () => {
    const { rerender } = renderBanner()
    // Accept to store a choice, then remount.
    const user = userEvent.setup()
    await user.click(
      await screen.findByRole('button', {
        name: 'cookieConsent.actions.acceptAll',
      })
    )

    rerender(
      <ConsentProvider>
        <CookieBanner />
      </ConsentProvider>
    )

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
  })
})
