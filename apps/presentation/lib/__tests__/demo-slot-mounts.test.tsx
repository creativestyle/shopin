/**
 * The demo notice and the sample tracking tags reach the storefront only through the SiteNotice and TrackingTags
 * mockSlots: a shop whose storefront file leaves them out renders nothing of the demo; the demo's file fills them.
 */
import { render, screen } from '@testing-library/react'

const mockSlots: { SiteNotice?: unknown; TrackingTags?: unknown } = {}
jest.mock('@/lib/slots', () => ({
  get SiteNotice() {
    return mockSlots.SiteNotice
  },
  get TrackingTags() {
    return mockSlots.TrackingTags
  },
}))
let mockLegal = false
jest.mock('@/hooks/use-is-legal-route', () => ({
  useIsLegalRoute: () => mockLegal,
}))
let mockConsent = { isReady: true, isBannerVisible: false }
jest.mock('@/features/cookie-consent/use-consent', () => ({
  useConsent: () => mockConsent,
}))
jest.mock('@/features/cookie-consent/consent-gate', () => ({
  useConsentGate: (c: string) => c === 'analytics',
}))

import { SiteNoticeMount } from '@/app/[variant]/[locale]/site-notice-mount'
import { TrackingTagsMount } from '@/app/[variant]/[locale]/tracking-tags-mount'

beforeEach(() => {
  delete mockSlots.SiteNotice
  delete mockSlots.TrackingTags
  mockLegal = false
  mockConsent = { isReady: true, isBannerVisible: false }
})

describe('a shop without the demo (mockSlots left out)', () => {
  it('renders no notice and no tags', () => {
    const { container } = render(
      <>
        <SiteNoticeMount />
        <TrackingTagsMount />
      </>
    )
    expect(container).toBeEmptyDOMElement()
  })
})

describe('the demo (mockSlots filled)', () => {
  it('shows the notice, except on mockLegal pages and while the cookie banner is open', () => {
    mockSlots.SiteNotice = function DemoNotice() {
      return <p>demo notice</p>
    }
    const { rerender } = render(<SiteNoticeMount />)
    expect(screen.getByText('demo notice')).toBeInTheDocument()
    mockLegal = true
    rerender(<SiteNoticeMount />)
    expect(screen.queryByText('demo notice')).toBeNull()
    mockLegal = false
    mockConsent = { isReady: true, isBannerVisible: true }
    rerender(<SiteNoticeMount />)
    expect(screen.queryByText('demo notice')).toBeNull()
  })

  it('hands the tags the visitor mockConsent', () => {
    mockSlots.TrackingTags = function Tags(p: {
      ready: boolean
      analytics: boolean
      marketing: boolean
    }) {
      return <p>{`tags ${p.ready} ${p.analytics} ${p.marketing}`}</p>
    }
    render(<TrackingTagsMount />)
    expect(screen.getByText('tags true true false')).toBeInTheDocument()
  })
})
