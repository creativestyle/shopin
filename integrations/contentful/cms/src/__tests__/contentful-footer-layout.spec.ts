import { LayoutService, LayoutFooterQuery } from '..'

type FooterEntry = Record<string, unknown>

function createService(footer: FooterEntry | null) {
  const request = jest.fn((query: unknown) =>
    query === LayoutFooterQuery
      ? Promise.resolve({ footerCollection: { items: footer ? [footer] : [] } })
      : Promise.reject(new Error('Unexpected query'))
  )
  return new LayoutService({ request } as never)
}

async function getFooter(footer: FooterEntry | null) {
  return createService(footer).getFooter('en-US')
}

function section(title: string | null, links: FooterEntry[]) {
  return { title, linksCollection: { items: links } }
}

function sections(...items: ReturnType<typeof section>[]) {
  return { footerLinksCollection: { items } }
}

describe('ContentfulLayoutService footer', () => {
  it('returns null when there is no footer entry', async () => {
    expect(await getFooter(null)).toBeNull()
  })

  it('maps a linked page slug to an unprefixed path', async () => {
    const footer = await getFooter(
      sections(
        section('Shop', [{ label: 'About', linkedPage: { slug: 'about' } }])
      )
    )
    expect(footer?.sections[0]?.links[0]?.url).toBe('/about')
  })

  it('strips leading slashes from a linked page slug', async () => {
    const footer = await getFooter(
      sections(
        section('Shop', [{ label: 'About', linkedPage: { slug: '//about' } }])
      )
    )
    expect(footer?.sections[0]?.links[0]?.url).toBe('/about')
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
    expect(footer?.sections[0]?.links).toEqual([
      { label: 'https://example.com', url: 'https://example.com' },
    ])
  })

  it('keeps an empty section title empty', async () => {
    const footer = await getFooter(
      sections(section(null, [{ label: 'About', url: '/about' }]))
    )
    expect(footer?.sections[0]?.title).toBe('')
  })

  it('drops sections with neither a title nor a link', async () => {
    const footer = await getFooter(
      sections(
        section(null, [{ label: null, url: null }]),
        section('', []),
        section('Shop', [])
      )
    )
    expect(footer?.sections).toEqual([{ title: 'Shop', links: [] }])
  })

  it('leaves out the fallback titles', async () => {
    const footer = await getFooter({
      paymentMethodsList: 'Visa\nPayPal',
      customerServicePhone: '+49 30 123456789',
    })
    expect(footer?.paymentMethods).toEqual({
      title: '',
      methods: ['Visa', 'PayPal'],
    })
    expect(footer?.customerService?.title).toBe('')
  })

  it('leaves contactUs undefined when the contact link has no label or url', async () => {
    const footer = await getFooter({
      customerServiceTitle: 'Customer service',
      customerServiceHours: 'Mon–Fri',
      customerServiceContactUs: { label: null, url: null },
    })
    expect(footer?.customerService).toEqual({
      title: 'Customer service',
      hours: 'Mon–Fri',
    })
  })

  it('omits customer service when it has only a title', async () => {
    const footer = await getFooter({ customerServiceTitle: 'Customer service' })
    expect(footer?.customerService).toBeUndefined()
  })

  it('keeps customer service without a title when it has a phone and hours', async () => {
    const footer = await getFooter({
      customerServicePhone: '+49 30 123456789',
      customerServiceHours: 'Mon–Fri',
    })
    expect(footer?.customerService).toEqual({
      title: '',
      phone: '+49 30 123456789',
      hours: 'Mon–Fri',
    })
  })
})
