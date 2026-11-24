/**
 * @jest-environment node
 */
import type { MainNavigationResponse } from '@core/contracts/navigation/main-navigation'
import type { FooterResponse } from '@core/contracts/content/layout'
import {
  collectCategoryPaths,
  collectContentPaths,
  collectProductDiscoveryPaths,
} from '../lib/collect-sitemap-paths'

const ORIGIN = 'https://shop.example'

const NAVIGATION: MainNavigationResponse = {
  items: [
    {
      text: 'Audio',
      href: '/c/audio',
      children: [
        {
          text: 'Headphones',
          href: '/c/headphones',
          children: [{ text: 'In-ear', href: '/c/in-ear' }],
        },
      ],
    },
    {
      text: 'Landing',
      href: '/landing',
      children: [{ text: 'TV', href: `${ORIGIN}/de/c/tv?sort=price#top` }],
    },
    { text: 'Foreign', href: 'https://other.example/c/foreign' },
    { text: 'Protocol-relative', href: '//cdn.example/c/cdn' },
    { text: 'Trailing slash', href: '/c/trailing/' },
    { text: 'Duplicate', href: '/de/c/audio' },
  ],
}

describe('collectCategoryPaths', () => {
  it('walks every level and normalizes internal category links', () => {
    expect(collectCategoryPaths(NAVIGATION, ORIGIN)).toEqual([
      '/c/audio',
      '/c/headphones',
      '/c/in-ear',
      '/c/tv',
      '/c/trailing',
    ])
  })

  it('rejects absolute URLs when the site origin is unknown', () => {
    expect(collectCategoryPaths(NAVIGATION)).not.toContain('/c/tv')
  })

  it('returns nothing without a navigation', () => {
    expect(collectCategoryPaths(null, ORIGIN)).toEqual([])
  })
})

describe('collectProductDiscoveryPaths', () => {
  it('stops at the outermost category but descends through non-category entries', () => {
    expect(collectProductDiscoveryPaths(NAVIGATION, false, ORIGIN)).toEqual([
      '/c/audio',
      '/c/tv',
      '/c/trailing',
    ])
  })

  it('walks sub-categories when asked to', () => {
    expect(collectProductDiscoveryPaths(NAVIGATION, true, ORIGIN)).toEqual(
      collectCategoryPaths(NAVIGATION, ORIGIN)
    )
  })
})

describe('collectContentPaths', () => {
  const footer: FooterResponse = {
    sections: [
      {
        title: 'Company',
        links: [
          { label: 'About', url: '/about' },
          { label: 'Über uns', url: '/de/ueber-uns' },
          { label: 'Help', url: `${ORIGIN}/help?topic=x#faq` },
          { label: 'Category', url: '/c/audio' },
          { label: 'Product', url: '/p/red-shoes' },
          { label: 'Checkout', url: '/checkout' },
          { label: 'Hidden', url: '/secret', noIndex: true },
          { label: 'No URL' },
          { label: 'Mail', url: 'mailto:hello@shop.example' },
          { label: 'Foreign', url: 'https://other.example/page' },
          { label: 'Home', url: '/' },
          { label: 'German home', url: '/de' },
        ],
      },
    ],
    legalLinks: [
      { label: 'Imprint', url: '/imprint/' },
      { label: 'About again', url: '/about' },
    ],
    customerService: {
      title: 'Service',
      contactUs: { label: 'Contact', url: '/contact' },
    },
  }

  it('keeps unique indexable CMS paths from all footer link groups', () => {
    expect(collectContentPaths(footer, ORIGIN)).toEqual([
      '/about',
      '/ueber-uns',
      '/help',
      '/imprint',
      '/contact',
    ])
  })

  it('returns nothing without a footer', () => {
    expect(collectContentPaths(null, ORIGIN)).toEqual([])
  })
})
