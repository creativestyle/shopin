import { render } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { DraftModeSessionBanner } from '../draft-mode-banner'

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }))

const ATTRIBUTE = 'data-draft-session'

function setMarker(on: boolean) {
  document.cookie = on
    ? 'preview_active=1; path=/'
    : 'preview_active=; max-age=0; path=/'
}

describe('DraftModeSessionBanner', () => {
  afterEach(() => {
    setMarker(false)
    document.documentElement.removeAttribute(ATTRIBUTE)
  })

  it('marks <html> when the session marker cookie is set', () => {
    jest.mocked(usePathname).mockReturnValue('/about-us')
    setMarker(true)
    render(<DraftModeSessionBanner />)
    expect(document.documentElement.hasAttribute(ATTRIBUTE)).toBe(true)
  })

  it('unmarks <html> on navigation after the session ends', () => {
    jest.mocked(usePathname).mockReturnValue('/about-us')
    setMarker(true)
    const { rerender } = render(<DraftModeSessionBanner />)

    setMarker(false)
    jest.mocked(usePathname).mockReturnValue('/cart')
    rerender(<DraftModeSessionBanner />)

    expect(document.documentElement.hasAttribute(ATTRIBUTE)).toBe(false)
  })

  it('renders a nofollow exit link so crawlers skip the exit route', () => {
    jest.mocked(usePathname).mockReturnValue('/about-us')
    const { getByRole } = render(<DraftModeSessionBanner />)
    expect(getByRole('link', { hidden: true })).toHaveAttribute(
      'rel',
      'nofollow'
    )
  })
})
