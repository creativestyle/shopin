/**
 * The demo notice and the sample tracking tags reach the storefront only through the SiteNotice and TrackingTags
 * slots, rendered by the server layout into ClientSlotsProvider: a shop whose storefront file leaves them out
 * renders nothing of the demo; the demo's file fills them. No client module imports the shop's storefront file.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { ClientSlotsProvider } from '@/features/slots/client-slots'
import { SiteNoticeMount } from '@/app/[variant]/[locale]/site-notice-mount'
import { TrackingTagsMount } from '@/app/[variant]/[locale]/tracking-tags-mount'

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

beforeEach(() => {
  mockLegal = false
  mockConsent = { isReady: true, isBannerVisible: false }
})

function DemoNotice() {
  return <p>demo notice</p>
}
function Tags(p: { ready: boolean; analytics: boolean; marketing: boolean }) {
  return <p>{`tags ${p.ready} ${p.analytics} ${p.marketing}`}</p>
}
const mounts = (slots: {
  siteNotice?: ReactElement
  trackingTags?: ReactElement<never>
}) => (
  <ClientSlotsProvider {...slots}>
    <SiteNoticeMount />
    <TrackingTagsMount />
  </ClientSlotsProvider>
)

describe('a shop without the demo (slots left out)', () => {
  it('renders no notice and no tags', () => {
    const { container } = render(mounts({}))
    expect(container).toBeEmptyDOMElement()
  })
})

describe('the demo (slots filled)', () => {
  it('shows the notice, except on legal pages and while the cookie banner is open', () => {
    const slots = { siteNotice: <DemoNotice /> }
    const { rerender } = render(mounts(slots))
    expect(screen.getByText('demo notice')).toBeInTheDocument()
    mockLegal = true
    rerender(mounts(slots))
    expect(screen.queryByText('demo notice')).toBeNull()
    mockLegal = false
    mockConsent = { isReady: true, isBannerVisible: true }
    rerender(mounts(slots))
    expect(screen.queryByText('demo notice')).toBeNull()
  })

  it('hands the tags the visitor consent (the layout renders them without it)', () => {
    render(
      mounts({
        trackingTags: (
          <Tags
            ready={false}
            analytics={false}
            marketing={false}
          />
        ) as ReactElement<never>,
      })
    )
    expect(screen.getByText('tags true true false')).toBeInTheDocument()
  })
})

/** A client module that imports the shop's storefront file, any of its entries (wired.mts too), or @/lib/slots. */
const clientImportsShopFile = (text: string) =>
  /^\s*['"]use client['"]/.test(text) &&
  /from ['"](@\/lib\/slots|@shopin\/storefront(\/[^'"]*)?)['"]/.test(text)

describe('the shop storefront file stays on the server', () => {
  it('the guard catches every entry of the storefront package and @/lib/slots, only in client modules', () => {
    for (const from of [
      '@/lib/slots',
      '@shopin/storefront',
      '@shopin/storefront/wired',
    ]) {
      expect(
        clientImportsShopFile(`'use client'\nimport * as x from '${from}'`)
      ).toBe(true)
      expect(clientImportsShopFile(`import * as x from '${from}'`)).toBe(false)
    }
    expect(
      clientImportsShopFile(`'use client'\nimport x from '@shopin/storefronts'`)
    ).toBe(false)
  })

  it("no 'use client' module imports @/lib/slots or @shopin/storefront", () => {
    const root = join(__dirname, '..', '..')
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        if (
          ['node_modules', '.next', '__tests__', '__fixtures__'].includes(name)
        ) {
          continue
        }
        const path = join(dir, name)
        if (statSync(path).isDirectory()) {
          walk(path)
        } else if (/\.(tsx?|mts)$/.test(name)) {
          const text = readFileSync(path, 'utf8')
          if (clientImportsShopFile(text)) {
            offenders.push(relative(root, path))
          }
        }
      }
    }
    for (const top of ['app', 'features', 'components', 'lib', 'hooks']) {
      walk(join(root, top))
    }
    expect(offenders).toEqual([])
  })
})
