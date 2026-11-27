/**
 * Demo tracking tags follow consent: a tag renders only for a consented category, its inline script sets
 * the identifier cookie and pushes the dataLayer event, and once consent is known a refused category's
 * cookie is removed (not before, so a consented visitor's cookie survives hydration).
 */
import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MockTrackingTags } from '../src/mock-tracking-tags'

// next/script needs the Next runtime; a plain inline script keeps id and body observable
jest.mock('next/script', () => ({
  __esModule: true,
  default: ({ id, children }: { id: string; children: ReactNode }) => (
    <script
      id={id}
      type='text/plain'
    >
      {children}
    </script>
  ),
}))

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

const clearCookie = (name: string) => {
  document.cookie = `${name}=; max-age=0; path=/`
}

beforeEach(() => {
  clearCookie('_analytics_id')
  clearCookie('_mkt_id')
  delete window.dataLayer
})

test('only consented categories render a tag', () => {
  const { container } = render(
    <MockTrackingTags
      ready
      analytics
      marketing={false}
    />
  )
  expect(container.querySelector('#mock-analytics')).not.toBeNull()
  expect(container.querySelector('#mock-marketing')).toBeNull()
})

test('the tag script sets its cookie and pushes its consent event', () => {
  const { container } = render(
    <MockTrackingTags
      ready
      analytics={false}
      marketing
    />
  )
  const body = container.querySelector('#mock-marketing')?.textContent ?? ''
  new Function(body)()
  expect(document.cookie).toMatch(/(^|; )_mkt_id=mock-marketing-[0-9a-z]+/)
  expect(window.dataLayer).toEqual([
    {
      event: 'marketing_consent_granted',
      id: expect.stringMatching(/^mock-marketing-/),
    },
  ])
})

test('a refused category loses its cookie once consent is known', () => {
  document.cookie = '_mkt_id=old; path=/'
  document.cookie = '_analytics_id=kept; path=/'
  render(
    <MockTrackingTags
      ready
      analytics
      marketing={false}
    />
  )
  expect(document.cookie).not.toContain('_mkt_id=')
  expect(document.cookie).toContain('_analytics_id=kept')
})

test('before consent is read no cookie is removed', () => {
  document.cookie = '_mkt_id=old; path=/'
  const { container } = render(
    <MockTrackingTags
      ready={false}
      analytics={false}
      marketing={false}
    />
  )
  expect(document.cookie).toContain('_mkt_id=old')
  expect(container.querySelector('script')).toBeNull()
})
