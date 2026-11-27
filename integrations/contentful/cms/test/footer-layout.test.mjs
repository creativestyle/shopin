import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import layoutServiceModule from '../dist/services/layout.service.js'
import graphql from '../dist/graphql/index.js'

const { LayoutService } = layoutServiceModule
const { LayoutFooterQuery } = graphql

/** Jest's toEqual: a property set to undefined counts as absent (recursively). */
function defined(value) {
  if (Array.isArray(value)) return value.map(defined)
  if (value === null || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, defined(v)])
  )
}

function assertEqual(actual, expected) {
  assert.deepEqual(defined(actual), defined(expected))
}

function createService(footer) {
  const request = mock.fn((query) =>
    query === LayoutFooterQuery
      ? Promise.resolve({ footerCollection: { items: footer ? [footer] : [] } })
      : Promise.reject(new Error('Unexpected query'))
  )
  return new LayoutService({ request })
}

async function getFooter(footer) {
  return createService(footer).getFooter('en-US')
}

function section(title, links) {
  return { title, linksCollection: { items: links } }
}

function sections(...items) {
  return { footerLinksCollection: { items } }
}

describe('ContentfulLayoutService footer', () => {
  it('returns null when there is no footer entry', async () => {
    assert.equal(await getFooter(null), null)
  })

  it('maps a linked page slug to an unprefixed path', async () => {
    const footer = await getFooter(
      sections(
        section('Shop', [{ label: 'About', linkedPage: { slug: 'about' } }])
      )
    )
    assert.equal(footer?.sections[0]?.links[0]?.url, '/about')
  })

  it('strips leading slashes from a linked page slug', async () => {
    const footer = await getFooter(
      sections(
        section('Shop', [{ label: 'About', linkedPage: { slug: '//about' } }])
      )
    )
    assert.equal(footer?.sections[0]?.links[0]?.url, '/about')
  })

  it('uses the url as label and drops links with neither', async () => {
    const footer = await getFooter(
      sections(
        section('Shop', [
          { url: 'https://example.com' },
          { label: '  ', url: null },
        ])
      )
    )
    assertEqual(footer?.sections[0]?.links, [
      { label: 'https://example.com', url: 'https://example.com' },
    ])
  })

  it('keeps an empty section title empty', async () => {
    const footer = await getFooter(
      sections(section(null, [{ label: 'About', url: '/about' }]))
    )
    assert.equal(footer?.sections[0]?.title, '')
  })

  it('drops sections with neither a title nor a link', async () => {
    const footer = await getFooter(
      sections(
        section(null, [{ label: null, url: null }]),
        section('', []),
        section('Shop', [])
      )
    )
    assertEqual(footer?.sections, [{ title: 'Shop', links: [] }])
  })

  it('leaves out the fallback titles', async () => {
    const footer = await getFooter({
      paymentMethodsList: 'Visa\nPayPal',
      customerServicePhone: '+49 30 123456789',
    })
    assertEqual(footer?.paymentMethods, {
      title: '',
      methods: ['Visa', 'PayPal'],
    })
    assert.equal(footer?.customerService?.title, '')
  })

  it('leaves contactUs undefined when the contact link has no label or url', async () => {
    const footer = await getFooter({
      customerServiceTitle: 'Customer service',
      customerServiceHours: 'Mon–Fri',
      customerServiceContactUs: { label: null, url: null },
    })
    assertEqual(footer?.customerService, {
      title: 'Customer service',
      hours: 'Mon–Fri',
    })
  })

  it('omits customer service when it has only a title', async () => {
    const footer = await getFooter({ customerServiceTitle: 'Customer service' })
    assert.equal(footer?.customerService, undefined)
  })

  it('keeps customer service without a title when it has a phone and hours', async () => {
    const footer = await getFooter({
      customerServicePhone: '+49 30 123456789',
      customerServiceHours: 'Mon–Fri',
    })
    assertEqual(footer?.customerService, {
      title: '',
      phone: '+49 30 123456789',
      hours: 'Mon–Fri',
    })
  })
})
